export interface Message {
  id: string;
  officeId: string;
  agentId: string | null;
  content: string;
  role: string;
  createdAt: Date;
}

export interface SendMessageInput {
  officeId: string;
  agentId?: string;
  content: string;
  role?: string;
}
