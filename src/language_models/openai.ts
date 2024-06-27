import OpenAI from 'openai';
import type {
	ChatCompletionMessage,
	ChatCompletionTool
} from 'openai/src/resources/chat/completions.js';
import { LanguageModel, Run, Runnable } from './language_model.js';
import { Message } from '../assistants/chat_history.js';
import { Tool, ToolCall } from '../assistants/tool.js';

export class OpenAILanguageModel extends LanguageModel {
	model: 'gpt-3.5-turbo' | 'gpt-4o' = 'gpt-3.5-turbo';
	client: OpenAI;
	run?: Run;

	constructor({
		model,
		apiKey
	}: {
		model: 'gpt-3.5-turbo' | 'gpt-4o';
		apiKey?: string;
	}) {
		super();

		this.model = model;
		this.client = new OpenAI({
			apiKey: apiKey || process.env.OPENAI_API_KEY
		});
	}

	async processResponseFromChatGpt(choice: OpenAI.ChatCompletion.Choice) {
		const createRunnables = () => {
			if (!this.run) {
				throw new Error('The run was not defined.');
			}
			if (choice.message.content) {
				this.run.runnables.push(
					new Runnable({
						message: new Message({
							content: choice.message.content,
							role: choice.message.role
						}),
						status: 'processed'
					})
				);
			}
			if (choice.message.tool_calls?.length) {
				const toolCalls = [];
				for (let chatGptToolCall of choice.message.tool_calls) {
					const tool = this.assistant?.getTool(
						chatGptToolCall.function.name
					);
					const properties = JSON.parse(
						chatGptToolCall.function.arguments
					);
					if (!tool) {
						throw new Error(
							`The tool ${chatGptToolCall.function.name} was not found when searching into the assistant.`
						);
					}
					toolCalls.push(
						new ToolCall({
							toolCallId: chatGptToolCall.id,
							tool: tool,
							properties: properties
						})
					);
				}
				this.run.runnables.push(
					new Runnable({
						toolCalls,
						status: 'waiting'
					})
				);
			}
		};

		const processRunnables = async () => {
			if (!this.run) {
				throw new Error('The run was not defined.');
			}
			for (let runnable of this.run.runnables) {
				if (
					runnable.status == 'processed' ||
					runnable.status == 'errored'
				) {
					continue;
				}
				try {
					this.assistant?.logger.log('info', `Processing tool calls`);
					this.assistant?.logger.log('debug', runnable.toolCalls);
					await runnable.process();
				} catch (error) {
					this.assistant?.logger.log(
						'error',
						`Error when trying to process tool call`
					);
				}
			}
		};

		if (!this.run) {
			this.run = new Run({ runnables: [] });
		}
		this.assistant?.logger.log('info', `Processing response`);
		this.assistant?.logger.log('debug', choice);

		createRunnables();
		await processRunnables();
	}

	async getChatHistoryMessages(run: Run): Promise<object[]> {
		if (!this.assistant?.chatHistory) {
			return [];
		}

		const getToolCallsExpectResponse = (runnable: Runnable): object[] => {
			if (!runnable.toolCalls) {
				return [];
			}
			const messages = [];
			const toolCallsThatExpectResponse =
				runnable.toolCalls; /*runnable.toolCalls.filter(
				item => item.tool.responseStrategy === 'answer'
			);*/
			const toolCalls = toolCallsThatExpectResponse.map(item => {
				return {
					id: item.toolCallId,
					type: 'function',
					function: {
						name: item.tool.name,
						arguments: JSON.stringify(item.properties)
					}
				};
			});
			messages.push({
				role: 'assistant',
				tool_calls: toolCalls
			});
			toolCallsThatExpectResponse.map(item => {
				messages.push({
					role: 'tool',
					tool_call_id: item.toolCallId,
					content: item.toolReturn
				});
			});
			return messages;
		};

		const getToolCallsNotExpectResponse = (
			runnable: Runnable
		): object[] => {
			throw new Error('Not implemented.');
		};

		// Get history from previus runs
		const runsHistory = (
			await this.assistant.chatHistory.getHistory()
		).filter(history => history.id !== run.id);
		runsHistory.push(run);
		let messages: object[] = [];
		runsHistory
			.map((run: Run) => {
				return run.runnables.map(runnable => {
					if (runnable.toolCalls?.length) {
						messages = messages.concat(
							getToolCallsExpectResponse(runnable)
						);
						//messages.concat(
						//	getToolCallsNotExpectResponse(runnable)
						//);
						return;
					}

					messages.push({
						role: runnable.message?.role,
						content: runnable.message?.content
					});
				});
			})
			.flat();

		return messages;
	}

	async processRun(run: Run): Promise<Run> {
		this.run = run;
		const tools = this.assistant?.tools.map((tool: Tool) => {
			const properties = tool.parameters.map(parameter => {
				return [
					[parameter.name],
					{
						type: parameter.type,
						description: parameter.description
					}
				];
			});

			const requiredParameters = tool.parameters
				.map(parameter => {
					if (parameter.required) {
						return parameter.name;
					}
				})
				.filter(required => required);

			return {
				type: 'function',
				function: {
					name: tool.name,
					description: tool.description,
					parameters: {
						type: 'object',
						properties: Object.fromEntries(properties),
						required: requiredParameters
					}
				}
			} as ChatCompletionTool;
		});

		const messages: object[] = [
			{ role: 'system', content: this.formattedInstructions },
			...(await this.getChatHistoryMessages(run))
		] as ChatCompletionMessage[];

		this.assistant?.logger.log(
			'info',
			'Getting chat completion from OpenAI'
		);
		this.assistant?.logger.log('debug', messages);

		const chatCompletion = await this.client.chat.completions.create({
			model: this.model,
			// @ts-ignore
			messages,
			...(tools?.length ? { tools } : null)
		});

		this.run.runnables.map(runnable => runnable.setStatus('processed'));

		await this.processResponseFromChatGpt(chatCompletion.choices[0]);
		this.run.setStatus('processed');

		return this.run;
	}

	async proccess(run: Run): Promise<Run> {
		let calls = 0;
		do {
			run = await this.processRun(run);
			this.assistant?.logger.log(
				'info',
				`Run processed, checking if has any pending runnables for it.`
			);
			this.assistant?.logger.log('debug', run.runnables);

			calls += 1;
		} while (calls <= this.maxDepthCalls && run.hasPendingRunnables());

		return run;
	}
}
