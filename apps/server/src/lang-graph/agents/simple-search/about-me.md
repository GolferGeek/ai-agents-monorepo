# Simple Search Agent

## Description
A stateful React-based agent that performs internet searches using the Tavily search API and processes the results using various language models (OpenAI, Anthropic, or Ollama). The agent maintains conversation state using thread IDs, allowing for contextual interactions across multiple queries.

## Input Parameters
```typescript
{
  query: string;              // The search query to be processed
  config: {
    provider: string;         // 'openai' | 'anthropic' | 'ollama'
    model: string;           // Model name (e.g., 'gpt-4', 'claude-3-opus-20240229', 'llama3.2')
    temperature: number;     // 0.0 to 1.0
    thread_id?: string;      // Optional thread ID for maintaining conversation state
  }
}
```

## Output Type
```typescript
string  // The processed response from the language model
```

## Example Output
```json
{
  "response": "Based on my search, Denver is the capital and largest city of Colorado. It's known as the Mile High City because its official elevation is exactly one mile (5,280 feet) above sea level. Denver is a vibrant city with a population of approximately 750,000 people (2020 census) and serves as a major economic and cultural hub for the Rocky Mountain region. The city offers numerous attractions including the Denver Art Museum, Denver Botanic Gardens, and easy access to Rocky Mountain outdoor activities. The climate is semi-arid with over 300 days of sunshine annually, though it can experience significant snowfall in winter months."
}
```

## Features
- Stateful conversations using thread IDs
- Multiple LLM provider support (OpenAI, Anthropic, Ollama)
- Internet search capability via Tavily
- Error handling and fallback mechanisms
- Configurable model parameters

## Technical Details
- Uses LangChain's React agent framework
- Implements MemorySaver for state management
- Supports streaming responses (currently disabled)
- Validates API keys before execution
- Handles both text and structured responses

## Usage in Orchestration
This agent is designed to be a fundamental building block in larger orchestration systems. It can be used for:
- Initial research gathering
- Fact verification
- Current events queries
- General knowledge queries

## Dependencies
- @langchain/community
- @langchain/core
- @langchain/langgraph
- Various LLM provider SDKs (OpenAI, Anthropic, Ollama)

## API Keys Required
- Tavily API key (required)
- OpenAI API key (if using OpenAI)
- Anthropic API key (if using Anthropic)
- Ollama requires local instance running 