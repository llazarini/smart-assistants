import { config as loadEnvironment } from 'dotenv';
import { Assistant, Message, ToolCall } from '..';
import { v4 as uuidv4 } from 'uuid';

export class LanguageModel {
	assistant: Assistant;
	formattedInstructions: string;

	constructor() {
		loadEnvironment();
	}

	async proccess(run: Run): Promise<Run> {
		throw new Error('Not implemented.');
	}

	getUserWaitingRunnable(run: Run) {
		const waiting = run.runnables.find(
			run => run.message?.role == 'user' && run.status == 'waiting'
		);
		if (!waiting) {
			throw new Error("User's waiting runnable not found.");
		}
		return waiting;
	}

	setInstructions(instructions: string) {
		this.formattedInstructions = instructions;
	}

	setAssistant(assistant: Assistant) {
		this.assistant = assistant;
	}
}

export class Runnable {
	message?: Message;
	toolCall?: ToolCall;
	status: 'waiting' | 'processed' | 'errored' = 'waiting';

	constructor({
		message,
		toolCall,
		status = 'waiting'
	}: {
		message?: Message;
		toolCall?: ToolCall;
		status?: 'waiting' | 'processed';
	}) {
		this.message = message;
		this.toolCall = toolCall;
		if (!this.message && !this.toolCall) {
			throw new Error(
				'The Runnable object must have either a message or a toolCall'
			);
		}
		this.status = status;
	}

	setStatus(status: 'processed' | 'errored') {
		this.status = status;
	}

	async process(): Promise<boolean> {
		if (this.message) {
			this.setStatus('processed');
			return true;
		}
		await this.toolCall.process();
	}
}

export class Run {
	id: string;
	runnables: Array<Runnable> = [];
	status: 'waiting' | 'processed' | 'errored' = 'waiting';

	constructor({ runnables }: { runnables: Runnable[] }) {
		this.id = uuidv4();
		this.runnables = runnables;
	}

	setStatus(status: 'waiting' | 'processed' | 'errored') {
		this.status = status;
	}
}
