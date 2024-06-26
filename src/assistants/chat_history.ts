import { Run } from '../language_models/language_model';
import { v4 as uuidv4 } from 'uuid';

export class Message {
	id: string;
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

	constructor(data?: { chatHistoryId: string }) {
		this.chatHistoryId = data?.chatHistoryId || uuidv4();
		this.runsHistory = [];
		this.loadHistory();
	}

	loadHistory() {
		throw new Error('Not implemented');
	}

	getHistory(): Run[] {
		throw new Error('Not implemented');
	}

	saveRun(run: Run) {
		throw new Error('Not implemented');
	}
}

export class MemoryChatHistory extends ChatHistory {
	loadHistory() {
		// Memory
	}

	getHistory(): Run[] {
		return this.runsHistory;
	}

	saveRun(run: Run) {
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
