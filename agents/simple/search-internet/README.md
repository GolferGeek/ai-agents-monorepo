# Search Internet Agent

A simple agent that can search the internet using various AI models and the Tavily search API.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env-sample` to `.env` and fill in your API keys:
```bash
cp .env-sample .env
```

3. Start the server:
```bash
npm start
```

## Usage

The server provides three endpoints:

### 1. Test Server
```bash
curl http://localhost:3000/test
```

### 2. Run Search Query

You can use different AI providers. Here are some examples:

#### Using Ollama (Default)
```bash
curl -X POST http://localhost:3000/run \
  -H "Content-Type: application/json" \
  -d '{
    "searchQuery": "What is the capital of France?",
    "search_agent": {
      "provider": "ollama",
      "model": "llama2",
      "temperature": 0.7,
      "baseUrl": "http://localhost:11434"
    }
  }'
```

#### Using OpenAI
```bash
curl -X POST http://localhost:3000/run \
  -H "Content-Type: application/json" \
  -d '{
    "searchQuery": "What is the capital of France?",
    "search_agent": {
      "provider": "openai",
      "model": "gpt-4",
      "temperature": 0.7,
      "api_key": "your-openai-api-key"
    }
  }'
```

#### Using Anthropic
```bash
curl -X POST http://localhost:3000/run \
  -H "Content-Type: application/json" \
  -d '{
    "searchQuery": "What is the capital of France?",
    "search_agent": {
      "provider": "anthropic",
      "model": "claude-3-opus-20240229",
      "temperature": 0.7,
      "api_key": "your-anthropic-api-key"
    }
  }'
```

### 3. Send Project Info to Mothership
```bash
curl -X POST http://localhost:3000/send-to-mothership
```

## Configuration

The agent supports three AI providers:
- Ollama (default, runs locally)
- OpenAI
- Anthropic

Each provider requires different configuration:

1. Ollama:
   - No API key required
   - Optional baseUrl (defaults to http://localhost:11434)
   - Requires Ollama to be running locally

2. OpenAI:
   - Requires API key
   - Supports various models (gpt-4, gpt-3.5-turbo, etc.)

3. Anthropic:
   - Requires API key
   - Supports Claude models

## Environment Variables

- `PORT`: Server port (default: 3000)
- `TAVILY_API_KEY`: Required for internet search
- `MOTHERSHIP_ENDPOINT`: Endpoint for sending project info (optional) 