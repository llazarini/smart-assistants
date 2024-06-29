import { test } from '@japa/runner';
import { Assistant, MemoryChatHistory, Tool, ToolParameter } from '../src';
import { OpenAILanguageModel } from '../src/language_models/openai';

class AddToShoppingCart extends Tool {
	name = 'addToCart';
	description = 'Add a product to the cart';
	responseStrategy: 'stop' | 'answer' = 'answer';
	parameters = [
		new ToolParameter({
			name: 'productName',
			description: 'Name of the product',
			type: 'string',
			required: true
		}),
		new ToolParameter({
			name: 'quantity',
			description: 'Quantity of products',
			type: 'number',
			required: true
		})
	];

	run({ productName, quantity }): string {
		console.log('adding product name', productName, quantity);
		return 'Success adding the product to the shopping cart';
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
			chatHistory: memoryChatHistory
		});
		console.log(await assistant.respond('Hey How are you?'));
		console.log(await assistant.respond('Please call me Leonardo'));
		console.log(await assistant.respond('What is my name?'));
	});

	test('creating an assistant with tools', async ({ assert }) => {
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
			tools: [new AddToShoppingCart()],
			chatHistory: new MemoryChatHistory(),
			logLevel: 'info'
		});
		console.log(
			await assistant.respond(
				'Can you add a banana to the shopping cart?'
			)
		);
		console.log(
			await assistant.respond(
				'Haha! Now add a banana and two cocumber to the cart!'
			)
		);
		console.log(await assistant.respond('Thank you!'));

		console.log(
			await assistant.respond(
				'Can you add an apple and a banana to the shopping cart?'
			)
		);
		console.log(
			await assistant.respond('What I have in my shopping cart?')
		);
	});
});
