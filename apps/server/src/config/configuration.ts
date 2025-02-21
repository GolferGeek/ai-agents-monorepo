export interface EnvironmentConfig {
  port: number;
  nodeEnv: string;
  openai: {
    apiKey: string;
  };
  anthropic: {
    apiKey: string;
  };
  tavily: {
    apiKey: string;
  };
  agentops: {
    apiKey: string;
  };
  pinecone: {
    apiKey?: string;
    indexName?: string;
  };
  elasticsearch: {
    url?: string;
    apiKey?: string;
    user?: string;
    password?: string;
  };
  mongodb: {
    uri?: string;
  };
  redis: {
    url?: string;
  };
}

export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // API Keys
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
  },
  tavily: {
    apiKey: process.env.TAVILY_API_KEY,
  },
  agentops: {
    apiKey: process.env.AGENTOPS_API_KEY,
  },
  
  // Vector Databases
  pinecone: {
    apiKey: process.env.PINECONE_API_KEY,
    indexName: process.env.PINECONE_INDEX_NAME,
  },
  elasticsearch: {
    url: process.env.ELASTICSEARCH_URL,
    apiKey: process.env.ELASTICSEARCH_API_KEY,
    user: process.env.ELASTICSEARCH_USER,
    password: process.env.ELASTICSEARCH_PASSWORD,
  },
  mongodb: {
    uri: process.env.MONGODB_URI,
  },
  redis: {
    url: process.env.REDIS_URL,
  },
}) as EnvironmentConfig; 