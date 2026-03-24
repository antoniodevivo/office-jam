export enum AgentRole {
  CEO = "CEO",
  CTO = "CTO",
  DEVELOPER = "DEVELOPER",
  DESIGNER = "DESIGNER",
  MARKETING = "MARKETING",
  LEGAL = "LEGAL",
  CUSTOM = "CUSTOM",
}

export interface Agent {
  id: string;
  officeId: string;
  name: string;
  role: AgentRole;
  systemPrompt: string | null;
  llmProvider: string;
  llmModel: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAgentInput {
  officeId: string;
  name: string;
  role: AgentRole;
  systemPrompt?: string;
  llmProvider?: string;
  llmModel?: string;
}
