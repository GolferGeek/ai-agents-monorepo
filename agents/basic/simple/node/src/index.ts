import express, { Request, Response } from 'express';
import { handleLLMRequest } from './llmHandler';

const app = express();
app.use(express.json());

const PORT = 5001;

interface ChatRequest {
  prompt: string;
  llmProvider: string;
  llmKeys: {
    openai?: string;
    anthropic?: string;
    ollamaEndpoint?: string;
    [key: string]: string | undefined;
  };
}

app.post('/api/chat', async (req: Request<any, any, ChatRequest>, res: Response) => {
    try {
        const { prompt, llmProvider, llmKeys } = req.body;
        
        // Convert provider name to lowercase for consistent matching
        const normalizedProvider = llmProvider.toLowerCase();
        
        if (!prompt || !llmProvider || !llmKeys) {
            return res.status(400).json({
                error: 'Missing required fields: prompt, llmProvider, and llmKeys'
            });
        }

        // Check if we have the key for the requested provider
        const providerKey = llmKeys[normalizedProvider];
        if (!providerKey) {
            return res.status(400).json({
                error: `Missing API key for provider: ${llmProvider}`
            });
        }

        const response = await handleLLMRequest(prompt, normalizedProvider, llmKeys);
        res.json({ response });
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 