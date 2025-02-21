## Add express

- Add express to the project
- Add run route to index.ts
- Add test route to index.ts
- Add a call to the mother ship with the .project.md markdown converted to json

The run route should take in a body with search query and api key information (post request)

The test route should be a get request to check the server is running

The mother ship should be able to accept the .project.md markdown converted to json (post request)

Update the agent.ts to receive the search query and api key information from the index.ts
- get the search query from the body of the post request
- for each agent, get the api provider, api key, and model name from the body of the post request
- have the agent use the api provider, api key, and model name to search the internet

## Tech Stuff
in LangGraph, each chat model has their own import:
- ChatOpenAI: import { ChatOpenAI } from "@langchain/openai";
- ChatAnthropic: import { ChatAnthropic } from "@langchain/anthropic";

so we'll need to have a different import for each agent and then switch on the api provider to use the correct model

here is an example of the body of the post request:
{
    "searchQuery": "What is the capital of France?",
    "search_agent": {
        "provider": "openai",
        "model": "o3-mini",
        "temperature": 0.7,
        "api_key": "YOUR_API_KEY_HERE"
    }
}

we will need to make sure that the agent in agent.ts is named properly so that we can switch on it with the "search_agent" key in the body of the post request. 