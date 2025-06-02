export interface AgentDetails {
  name: string;
  description: string;
  systemPrompt: string;
  persona: string;
  model: string;
}

export interface Agent {
  id?: string;
  version: number;
  details: AgentDetails;
  status: 'enabled' | 'disabled' | 'pending' | 'error';
} 