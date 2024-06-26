import OpenAI from 'openai';
import { ChatCompletionTool } from 'openai/src/resources/chat/completions';
import { LanguageModel, Message, Run, Runnable, ToolCall } from '..';
import { ChatCompletionMessageParam } from 'openai/resources';

export class OpenAILanguageModel extends LanguageModel {
	model: 'gpt-3.5-turbo' | 'gpt-4o' = 'gpt-3.5-turbo';
	client: OpenAI;
	run: Run;

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
				for (let chatGptToolCall of choice.message.tool_calls) {
					const tool = this.assistant.getTool(
						chatGptToolCall.function.name
					);
					const properties = JSON.parse(
						chatGptToolCall.function.arguments
					);
					this.run.runnables.push(
						new Runnable({
							toolCall: new ToolCall({
								tool: tool,
								properties: properties
							}),
							status: 'waiting'
						})
					);
				}
			}
		};

		const processRunnables = async () => {
			for (let runnable of this.run.runnables) {
				if (runnable.status == 'processed') {
					continue;
				}
				try {
					this.assistant.logger.log(
						'info',
						`Processing tool call ${
							runnable.toolCall.tool.name
						} with parameters ${JSON.stringify(
							runnable.toolCall.tool.parameters
						)} `
					);
					await runnable.process();
					runnable.setStatus('processed');
				} catch (error) {
					this.assistant.logger.log(
						'error',
						`Error when trying to process tool call`
					);
				}
			}
		};

		this.assistant.logger.log('info', `Processing response`);

		createRunnables();
		await processRunnables();
	}

	async getChatHistoryMessages(): Promise<object[]> {
		if (!this.assistant.chatHistory) {
			return [];
		}
		const history = await this.assistant.chatHistory.getHistory();

		const messages = history
			.map((run: Run) => {
				return run.runnables.map(runnable => {
					return {
						role: runnable.message?.role,
						content: runnable.message?.content
					};
				});
			})
			.flat();

		return messages;
	}

	async proccess(run: Run): Promise<Run> {
		this.run = run;
		const tools = this.assistant.tools.map(tool => {
			const properties = tool.parameters.map(parameter => {
				return [
					[parameter.name],
					{
						type: parameter.type,
						description: parameter.description
					}
				];
			});

			return {
				type: 'function',
				function: {
					name: tool.name,
					description: tool.description,
					parameters: {
						type: 'object',
						properties: Object.fromEntries(properties),
						required: []
					}
				}
			} as ChatCompletionTool;
		});

		const userWaitingRunnable = this.getUserWaitingRunnable(this.run);

		const messages: object[] = [
			{ role: 'system', content: this.formattedInstructions },
			...(await this.getChatHistoryMessages()),
			{ role: 'user', content: userWaitingRunnable.message.content }
		] as ChatCompletionMessageParam[];

		this.assistant.logger.log(
			'info',
			'Getting chat completion from OpenAI'
		);

		const chatCompletion = await this.client.chat.completions.create({
			model: this.model,
			// @ts-ignore
			messages,
			tools
		});
		userWaitingRunnable.setStatus('processed');

		await this.processResponseFromChatGpt(chatCompletion.choices[0]);
		this.run.setStatus('processed');

		return this.run;
	}
}
