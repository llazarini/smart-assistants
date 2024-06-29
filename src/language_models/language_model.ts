import { config as loadEnvironment } from 'dotenv';
import { Assistant } from '../assistants/assistant.js';
import { Run } from '../assistants/run.js';

export class LanguageModel {
	assistant?: Assistant;
	formattedInstructions: string = '';
	maxDepthCalls: number = 10;

	constructor() {
		loadEnvironment();
	}

	async proccess(_run: Run): Promise<Run> {
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
