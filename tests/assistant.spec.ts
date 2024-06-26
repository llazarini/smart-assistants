import { test } from '@japa/runner';
import { Assistant, MemoryChatHistory, Tool, ToolParameter } from '../src';
import { OpenAILanguageModel } from '../src/language_models/openai';

class AddToChart extends Tool {
	name = 'addToCart';
	description = 'Add a product to the cart';
	parameters = [
		new ToolParameter('productName', 'Name of the product', 'string'),
		new ToolParameter('quantity', 'Quantity of product', 'number')
	];

	run({ productName, quantity }): string {
		return 'Sucesso ao adicionar?';
	}
}

test.group('Assistant', () => {
	test('creating simple assistant', async ({ assert }) => {
		const memoryChatHistory = new MemoryChatHistory();
		const assistant = new Assistant({
			languageModel: new OpenAILanguageModel({
				model: 'gpt-3.5-turbo',
				apiKey: process.env.OPENAI_API_KEY
			}),
			description:
				'You are an assistant that help people adding products to the shopping cart',
			instructions: [
				'You are funny',
				'You are only allowed to answer in english or portuguese.'
			],
			tools: [new AddToChart()],
			chatHistory: memoryChatHistory
		});
		console.log(await assistant.respond('Oi tudo bem?'));
		console.log(
			await assistant.respond('Gostaria de saber qual o seu nome')
		);
	});
});
