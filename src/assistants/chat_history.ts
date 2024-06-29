import { v4 as uuidv4 } from 'uuid';
import { Assistant } from './assistant.js';
import { Run } from './run.js';

export class Message {
	id?: string;
	role: 'assistant' | 'user' | 'system';
	content: string;

	constructor({
		content,
		role,
		id
	}: {
		content: string;
		role: 'assistant' | 'user' | 'system';
		id?: string;
	}) {
		this.content = content;
		this.role = role;
		this.id = id;
	}
}

export class ChatHistory {
	chatHistoryId: string;
	runsHistory: Run[];
	assistant?: Assistant;
	constructor(data?: { chatHistoryId: string }) {
		this.chatHistoryId = data?.chatHistoryId || uuidv4();
		this.runsHistory = [];
	}

	async setAssistant(assistant: Assistant) {
		this.assistant = assistant;
	}

	async getHistory(): Promise<Run[]> {
		throw new Error('Not implemented');
	}

	async saveRun(_run: Run): Promise<void> {
		throw new Error('Not implemented');
	}
}

/**
 * Simple memory chat history
 */
export class MemoryChatHistory extends ChatHistory {
	async getHistory(): Promise<Run[]> {
		return this.runsHistory;
	}

	async saveRun(run: Run) {
		const existingRunI = this.runsHistory.findIndex(
			item => item.id === run.id
		);
		if (existingRunI >= 0) {
			this.runsHistory[existingRunI] = run;
		} else {
			this.runsHistory.push(run);
		}
	}
}
