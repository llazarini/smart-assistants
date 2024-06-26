import pino from 'pino';

export class AssistantLogger {
	level: 'info' | 'debug' | 'silent';
	constructor(level: 'info' | 'debug' | 'silent') {
		this.level = level;
	}
	log(level: 'info' | 'debug' | 'error', message: any) {
		throw new Error('Not implemented');
	}
}

export class PinoLogger extends AssistantLogger {
	logger: pino.Logger;

	constructor(level: 'info' | 'debug' | 'silent') {
		super(level);

		this.logger = pino({
			level: this.level,
			transport: {
				target: 'pino-pretty'
			}
		});
	}

	log(level: 'info' | 'debug' | 'error', message: any) {
		this.logger[level](message);
	}
}