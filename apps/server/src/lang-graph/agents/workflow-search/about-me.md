# Workflow Search Agent

## Description
A stateful search agent that maintains conversation context and handles multi-turn interactions. Built using LangGraph's workflow system, this agent can understand follow-up questions and maintain context across multiple queries within the same conversation thread.

## Input Parameters
```typescript
{
  query: string;              // The search query to be processed
  config: {
    provider: 'anthropic' | 'openai' | 'ollama';  // LLM provider to use
    model: string;           // Model name (e.g., 'claude-3-opus-20240229', 'gpt-4')
    temperature: number;     // 0.0 to 1.0
    thread_id: string;      // Conversation thread ID for state management
    maxResults?: number;    // Maximum number of search results (default: 3)
  }
}
```

## Output Type
```typescript
{
  result: string;           // The processed response
  metadata: {
    query: string;         // Original query
    timestamp: string;     // ISO timestamp
    provider: string;      // LLM provider used
    searchResults: number; // Number of search results retrieved
    conversationId: string; // Thread ID
    messageCount: number;   // Total messages in conversation
  };
  messages: BaseMessage[];  // Full conversation history
}
```

## Features
- Stateful conversation management
- Context-aware follow-up handling
- Multiple LLM provider support
- Automatic conversation cleanup (1-hour timeout)
- Thread-based conversation isolation
- Tool-augmented responses using Tavily search

## Technical Details
- Uses LangGraph's StateGraph for workflow management
- Implements ToolNode for search capabilities
- Maintains conversation state in memory
- Supports multiple concurrent conversations
- Thread-safe state management
- Automatic resource cleanup

## Usage Examples

### Initial Query
```bash
curl -X POST http://localhost:3000/lang-graph/agents/workflow-search/execute \
  -H "Content-Type: application/json" \
  -d '{
    "query": "what is the weather in sf",
    "config": {
      "provider": "anthropic",
      "model": "claude-3-opus-20240229",
      "temperature": 0.7,
      "thread_id": "weather-convo-1"
    }
  }'
```

### Follow-up Query
```bash
curl -X POST http://localhost:3000/lang-graph/agents/workflow-search/execute \
  -H "Content-Type: application/json" \
  -d '{
    "query": "what about ny",
    "config": {
      "provider": "anthropic",
      "model": "claude-3-opus-20240229",
      "temperature": 0.7,
      "thread_id": "weather-convo-1"
    }
  }'
```

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

## State Management
The agent maintains conversation state including:
- Full message history
- Workflow instance
- Last update timestamp
- Automatic cleanup of inactive conversations

## Best Practices
1. Use consistent thread_ids for related queries
2. Keep conversations focused on a single topic
3. Start new threads for new topics
4. Consider conversation timeout (1 hour) in your application design
5. Handle potential state cleanup in long-running applications

## Limitations
- Conversation state is in-memory only (resets on service restart)
- 1-hour conversation timeout
- Maximum context length determined by LLM model
- Tool calls limited to Tavily search 