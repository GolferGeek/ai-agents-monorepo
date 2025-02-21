export interface Agent {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'error';
}

export interface AgentExecution {
  executionId: string;
  agentId: string;
  status: 'processing' | 'completed' | 'failed';
  data: any;
}

export interface AgentHistoryEntry {
  executionId: string;
  timestamp: string;
  status: 'completed' | 'failed';
}

export interface AgentHistory {
  agentId: string;
  history: AgentHistoryEntry[];
} 