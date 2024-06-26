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
	name: string = '';
	description: string = '';
	parameters: ToolParameter[] = [];

	constructor() {}

	run(_parameters: any): any {
		throw new Error('Not implemented');
	}
}

export class ToolCall {
	tool: Tool;
	properties: object;
	toolReturn: any;

	constructor({ tool, properties }: { tool: Tool; properties: object }) {
		this.tool = tool;
		this.properties = properties;
	}

	async process() {
		this.toolReturn = await this.tool.run(this.properties);
		return true;
	}
}
