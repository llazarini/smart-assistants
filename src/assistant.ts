import { LanguageModel } from './language_model';
import * as fs from 'node:fs';
import * as path from 'node:path';
export class Database {}

export class Message {
	role: 'assistant' | 'user';
	id: string;
	message: string;
}

export class Chat {
	database: Database;
	messages: Message[];
}

export class ToolParameter {
	name: string;
	description: string;
	type: 'string' | 'number' | 'boolean';

	constructor(
		name: string,
		description: string,
		type: 'string' | 'number' | 'boolean'
	) {
		this.name = name;
		this.description = description;
		this.type = type;
	}
}

export class Tool {
	name: string;
	description: string;
	callback: Function;
	parameters: ToolParameter[];

	constructor({
		name,
		description,
		callback,
		parameters
	}: {
		name: string;
		description: string;
		callback: Function;
		parameters: ToolParameter[];
	}) {
		this.name = name;
		this.description = description;
		this.callback = callback;
		this.parameters = parameters;
	}
}

export class Assistant {
	chat?: Chat;
	languageModel: LanguageModel;
	tools: Tool[];
	description: string[];
	instructions: string[];
	debug: boolean = false;
	language: 'en' | 'pt' = 'en';

	constructor({
		languageModel,
		description,
		instructions,
		debug,
		chat,
		tools
	}: {
		languageModel: LanguageModel;
		description: string | string[];
		instructions?: string | string[];
		debug?: boolean;
		chat?: Chat;
		tools?: Tool[];
	}) {
		this.chat = chat;
		this.languageModel = languageModel;
		this.tools = tools || [];
		this.description =
			typeof description == 'object'
				? description
				: description.split('\n') || [];
		this.instructions =
			typeof instructions == 'object'
				? instructions
				: instructions.split('\n') || [];
		this.debug = debug || true;
	}

	getInstructions(): string {
		const getInstructions = (language: string) => {
			const instructionsFilePath = path.resolve(
				__dirname,
				`assets/instructions/${language}.json`
			);
			const instructionsFile = fs.readFileSync(instructionsFilePath);
			return JSON.parse(instructionsFile.toString());
		};
		const instructions = getInstructions(this.language);
		let prompt = this.description;

		if (this.instructions.length) {
			prompt.push(instructions.systemPrompt.followInstructions);
			prompt.push('<instructions>');
			prompt = prompt.concat(this.instructions);
			prompt.push('</instructions>');
		}

		return prompt.join('\n');
	}

	async respond(message: string) {
		this.languageModel.setAssistantInstructions(this.getInstructions());
		this.languageModel.setTools(this.tools);
		return await this.languageModel.respond(message);
	}
}
