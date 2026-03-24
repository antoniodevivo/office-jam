export enum ActivityType {
  AGENT_CREATED = "AGENT_CREATED",
  TASK_CREATED = "TASK_CREATED",
  TASK_ASSIGNED = "TASK_ASSIGNED",
  TASK_STARTED = "TASK_STARTED",
  TASK_COMPLETED = "TASK_COMPLETED",
  TASK_FAILED = "TASK_FAILED",
  MESSAGE_SENT = "MESSAGE_SENT",
  AGENT_THINKING = "AGENT_THINKING",
  AGENT_RESPONDING = "AGENT_RESPONDING",
  AGENT_DELEGATING = "AGENT_DELEGATING",
}

export interface Activity {
  id: string;
  officeId: string;
  agentId: string | null;
  taskId: string | null;
  type: ActivityType;
  payload: Record<string, unknown> | null;
  createdAt: Date;
}
