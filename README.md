### Smart Assistants

Create Smart LLM Assistants with Memory, Function calling and more to come.

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


