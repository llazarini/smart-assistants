### Smart Assistants

Create Smart LLM Assistants with Memory, Function calling and more to come.

*The library and documentation is still in development*

#### Installation

@todo

#### Get started

Basic usage

```typescript
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
	chatHistory: new MemoryChatHistory()
});
console.log(await assistant.respond('Oi tudo bem?'));
console.log(
	await assistant.respond('Gostaria de saber qual o seu nome')
);
```


