### Smart Assistants

Create Smart LLM Assistants with Memory, Function calling and more to come. Inspired by phidata Python library.

*The library and documentation is still in development*
*I don't recommend using it in production yet*

#### Installation

```
npm install smart-assistants
// or yarn add smart-assistants
```

#### Get started

Basic usage

```typescript
import { Assistant, OpenAILanguageModel } from 'smart-assistants'

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
});
console.log(await assistant.respond('Hey, how are you?'));
console.log(
	await assistant.respond('I would like to know your name')
);
```


### Creating a tool

You can add a tool to your assistant using the Tool class:

```typescript
import { Tool, ToolParameter } from 'smart-assistants'

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
```

Then, inside your assistant class you can:
```typescript
import { Assistant } from 'smart-assistants'
const assistant = new Assistant({
	...
	tools: [new AddToChart()],
	...
});
```


### Adding Chat History memory to your assistant

You can add memory to your assistant, so he can remember all the interactions he had with your user.
Basic usage:

```typescript
import { MemoryChatHistory } from 'smart-assistants'


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
	chatHistory: new MemoryChatHistory()
});
```

You can also customize a Chat History class to connect with your database. 
You can extend the ChatHistory class and implement your own class.
