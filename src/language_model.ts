import { Assistant, Tool } from './assistant';
import OpenAI from 'openai';
import { ChatCompletionTool } from 'openai/src/resources/chat/completions';

export class LanguageModel {
	instructions: string;
	tools: Tool[];

	async respond(message: string): Promise<string> {
		throw new Error('Not implemented.');
	}

	setTools(tools: Tool[]) {
		this.tools = tools;
	}

	setAssistantInstructions(instructions: string) {
		this.instructions = instructions;
	}
}

export class OpenAILanguageModel extends LanguageModel {
	model: 'gpt-3.5-turbo' | 'gpt-4o' = 'gpt-3.5-turbo';
	client: OpenAI;

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

	async processResponse(choice: OpenAI.ChatCompletion.Choice) {}

	async getChatHistoryMessages() {
		return [];
	}

	async respond(message: string): Promise<string> {
		const instructions = this.instructions;

		const tools = this.tools.map(tool => {
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

		const messages = [
			{ role: 'system', content: this.instructions },
			...(await this.getChatHistoryMessages()),
			{ role: 'user', content: message }
		];

		const chatCompletion = await this.client.chat.completions.create({
			model: this.model,
			messages,
			tools
		});

		await this.processResponse(chatCompletion.choices[0]);

		return 'Tudo e com você?';
	}
}
