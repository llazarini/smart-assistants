export class ToolParameter {
	name: string;
	description: string;
	type: 'string' | 'number' | 'boolean';
	required: boolean;

	constructor({
		name,
		description,
		type,
		required = false
	}: {
		name: string;
		description: string;
		type: 'string' | 'number' | 'boolean';
		required: boolean;
	}) {
		this.name = name;
		this.description = description;
		this.type = type;
		this.required = required;
	}
}

export class Tool {
	name: string = '';
	description: string = '';
	parameters: ToolParameter[] = [];
	responseStrategy: 'stop' | 'answer' = 'answer';

	constructor() {}

	run(_parameters: any): any {
		throw new Error('Not implemented');
	}
}

export class ToolCall {
	toolCallId?: string;
	tool: Tool;
	properties: object;
	toolReturn: any;

	constructor({
		toolCallId,
		tool,
		properties
	}: {
		toolCallId?: string;
		tool: Tool;
		properties: object;
	}) {
		this.tool = tool;
		this.properties = properties;
		this.toolCallId = toolCallId;
	}

	async process() {
		this.toolReturn = await this.tool.run(this.properties);
		return true;
	}
}
