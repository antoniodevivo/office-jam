export enum ExecutionStatus {
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
  TIMEOUT = "timeout",
  BUDGET_EXCEEDED = "budget_exceeded",
}

export interface GuardrailConfig {
  maxIterations: number;
  maxExecutionMs: number;
  maxTokenBudget: number;
}

export const DEFAULT_GUARDRAILS: GuardrailConfig = {
  maxIterations: 10,
  maxExecutionMs: 300000, // 5 minutes
  maxTokenBudget: 50000,
};

export interface TaskExecution {
  id: string;
  taskId: string;
  status: ExecutionStatus;
  iterationCount: number;
  totalTokensUsed: number;
  result: unknown | null;
  error: string | null;
  startedAt: Date;
  completedAt: Date | null;
}

export interface AgentOutput {
  agentName: string;
  output: unknown;
  tokensUsed: number;
}
