import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'url';
import { AssistantLogger, PinoLogger } from './logger';
import { Tool } from './tool';
import {
	LanguageModel,
	Run,
	Runnable
} from '../language_models/language_model';
import { ChatHistory, Message } from './chat_history';

export class Assistant {
	languageModel: LanguageModel;
	tools: Tool[];
	description: string[];
	instructions: string[];
	debug: boolean = false;
	language: 'en' | 'pt' = 'en';
	logger: AssistantLogger;
	chatHistory: ChatHistory;

	constructor({
		languageModel,
		description,
		instructions,
		tools,
		logLevel = 'debug',
		chatHistory
	}: {
		languageModel: LanguageModel;
		description: string | string[];
		instructions?: string | string[];
		tools?: Tool[];
		logLevel?: 'debug' | 'info' | 'silent';
		chatHistory?: ChatHistory;
	}) {
		this.languageModel = languageModel;
		this.tools = tools || [];
		this.description =
			typeof description == 'object'
				? description
				: description?.split('\n') || [];
		this.instructions =
			typeof instructions == 'object'
				? instructions
				: instructions?.split('\n') || [];
		this.logger = new PinoLogger(logLevel);
		this.chatHistory = chatHistory;
	}

	getTool(toolName: string): Tool {
		const tool = this.tools.find(tool => tool.name === toolName);
		if (!tool) {
			throw new Error(
				`Tool '${toolName}' was not found in the assistant.`
			);
		}
		return tool;
	}

	/**
	 * Get the system instructions for LLM model
	 * @returns string
	 */
	getInstructions(): string {
		const getTranslatedInstructions = (language: string) => {
			this.logger.log(
				'info',
				`Getting instructions in language: ${language}`
			);
			const instructionsFilePath = path.resolve(
				path.resolve(fileURLToPath(import.meta.url), '..', '..'),
				`assets/instructions/${language}.json`
			);
			const instructionsFile = fs.readFileSync(instructionsFilePath);
			return JSON.parse(instructionsFile.toString());
		};

		this.logger.log('info', `Building system prompt`);

		const translatedInstructions = getTranslatedInstructions(this.language);
		let prompt: string[] | string = this.description;

		if (this.instructions.length) {
			prompt.push(translatedInstructions.systemPrompt.followInstructions);
			prompt.push('<instructions>');
			prompt = prompt.concat(this.instructions);
			prompt.push('</instructions>');
		}

		this.logger.log('info', `Sucessfully built the system prompt`);
		prompt = prompt.join('\n');
		this.logger.log('debug', prompt);
		return prompt;
	}

	async respond(message: string) {
		this.languageModel.setAssistant(this);
		this.languageModel.setInstructions(this.getInstructions());

		const runnable = new Runnable({
			message: new Message({ content: message, role: 'user' })
		});
		const run = new Run({ runnables: [runnable] });
		const processedRun = await this.processRun(run);

		const lastRunnable = processedRun.runnables
			.reverse()
			.find(runnable => runnable.message.role == 'assistant');

		return lastRunnable.message.content;
	}

	async processRun(run: Run) {
		if (this.chatHistory) {
			this.chatHistory.saveRun(run);
		}

		run = await this.languageModel.proccess(run);

		if (this.chatHistory) {
			this.chatHistory.saveRun(run);
		}

		return run;
	}
}