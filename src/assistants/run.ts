import { v4 as uuidv4 } from 'uuid';
import { Message } from '../assistants/chat_history.js';
import { ToolCall } from '../assistants/tool.js';

export class Runnable {
	message?: Message;
	toolCalls?: ToolCall[];
	status: 'waiting' | 'waiting_response' | 'processed' | 'errored' =
		'waiting';

	constructor({
		message,
		toolCalls,
		status = 'waiting'
	}: {
		message?: Message;
		toolCalls?: ToolCall[];
		status?: 'waiting' | 'processed';
	}) {
		this.message = message;
		this.toolCalls = toolCalls || [];
		if (!this.message && !this.toolCalls) {
			throw new Error(
				'The Runnable object must have either a message or a toolCall'
			);
		}
		this.status = status;
	}

	setStatus(status: 'processed' | 'errored' | 'waiting_response') {
		this.status = status;
	}

	/**
	 * Process the runnable.
	 * If it's an message don't have anything to process.
	 * If it's a tool call, call the function and set the status
	 * @returns
	 */
	async process(): Promise<boolean> {
		if (this.message) {
			this.setStatus('processed');
			return true;
		}
		if (!this.toolCalls?.length) {
			throw new Error(
				'The runnable is not either a message and a tool call.'
			);
		}
		const processes = await Promise.allSettled(
			this.toolCalls.map(toolCall => {
				this.processToolCall(toolCall);
			})
		);

		// Check if it have any issue
		if (
			processes.filter(process => process.status !== 'fulfilled').length
		) {
			this.setStatus('errored');
			return false;
		}

		// Check if strategy is to answer or if it's already processed
		if (
			this.toolCalls.filter(
				toolCall => toolCall.tool.responseStrategy === 'answer'
			).length
		) {
			this.setStatus('waiting_response');
		} else {
			this.setStatus('processed');
		}
		return true;
	}

	async processToolCall(toolCall: ToolCall) {
		await toolCall.process();
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

	hasPendingRunnables(): boolean {
		return !!this.runnables.find(
			runnable =>
				runnable.status !== 'processed' && runnable.status !== 'errored'
		);
	}
}
