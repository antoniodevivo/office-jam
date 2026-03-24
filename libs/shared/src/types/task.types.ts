export enum TaskStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

export interface Task {
  id: string;
  officeId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskInput {
  officeId: string;
  title: string;
  description?: string;
}

export interface TaskAssignment {
  id: string;
  taskId: string;
  agentId: string;
  assignedAt: Date;
}
