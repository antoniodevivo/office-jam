// WebSocket event types -- will be expanded in Phase 3 (Real-Time Layer)
export enum WsEventType {
  ACTIVITY = "activity",
  MESSAGE = "message",
  TASK_UPDATE = "task_update",
  AGENT_UPDATE = "agent_update",
}

export interface WsEvent<T = unknown> {
  type: WsEventType;
  officeId: string;
  payload: T;
  timestamp: Date;
}
