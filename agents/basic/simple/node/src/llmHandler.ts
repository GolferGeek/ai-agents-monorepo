import { OpenAI } from 'openai';
import axios from 'axios';

interface LLMKeys {
    openai?: string;
    ollamaEndpoint?: string;
    [key: string]: string | undefined;
}

async function handleOpenAIRequest(prompt: string, apiKey: string): Promise<string> {
    const openai = new OpenAI({ apiKey });
    
    const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
    });

    const content = response.choices[0].message.content ?? '';
    if (!content) {
        throw new Error('OpenAI returned empty response');
    }
    return content;
}

async function handleOllamaRequest(prompt: string, ollamaEndpoint: string = 'http://localhost:11434'): Promise<string> {
    const response = await axios.post(`${ollamaEndpoint}/api/generate`, {
        model: "llama2",
        prompt: prompt,
        stream: false
    });

    return response.data.response;
}

export async function handleLLMRequest(prompt: string, llmProvider: string, llmKeys: LLMKeys): Promise<string> {
    switch (llmProvider.toLowerCase()) {
        case 'openai':
            if (!llmKeys.openai) throw new Error('OpenAI API key is required');
            return await handleOpenAIRequest(prompt, llmKeys.openai);
            
        case 'ollama':
            return await handleOllamaRequest(prompt, llmKeys.ollamaEndpoint);
            
        // Add more cases for other LLM providers here
        // case 'anthropic':
        // case 'gemini':
        // etc.
            
        default:
            throw new Error(`Unsupported LLM provider: ${llmProvider}`);
    }
} 