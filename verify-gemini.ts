import { GeminiModelProvider } from './agent-engine/src/gemini-model-provider.js';
import * as dotenv from 'dotenv';
dotenv.config();

async function verify() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log('GEMINI_API_KEY not found in environment. Skipping real API test.');
    return;
  }

  const provider = new GeminiModelProvider(apiKey);
  console.log('Provider initialized. Testing generation...');

  try {
    const result = await provider.generate('Hello, are you operational?', 'nano');
    console.log('Generation successful!');
    console.log('Response:', result.content);
    console.log('Usage:', result.usage);
  } catch (error) {
    console.error('Generation failed:', error);
  }
}

verify();
