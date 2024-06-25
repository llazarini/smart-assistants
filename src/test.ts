import { Assistant, Tool, ToolParameter } from './assistant.js';
import { OpenAILanguageModel } from './language_model.js';

const test = async () => {
	const addToCart = new Tool({
		name: 'addToCart',
		description: 'Add a product to the cart',
		parameters: [
			new ToolParameter('productName', 'Name of the product', 'string'),
			new ToolParameter('quantity', 'Quantity of product', 'number')
		],
		callback: (productName: string, quantity: number) => {
			console.log(productName);
			return 'Sucesso ao adicionar?';
		}
	});

	const assistant = new Assistant({
		languageModel: new OpenAILanguageModel({
			model: 'gpt-3.5-turbo',
			apiKey: process.env.OPENAI_API_KEY
		}),
		description:
			'Você é um agente que auxilia na criação de apostas para um cassino',
		instructions: ['Você apenas responde em português', 'Você é educado'],
		tools: [addToCart]
	});
	console.log(await assistant.respond('Oi tudo bem?'));
	console.log(
		await assistant.respond('Adicione uma banana ao carrinho de compras')
	);
};

test();
