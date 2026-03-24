import { Annotation, messagesStateReducer } from "@langchain/langgraph";
import type { BaseMessage } from "@langchain/core/messages";

/**
 * LangGraph workflow state for multi-agent task execution.
 *
 * Uses Annotation.Root (LangGraph.js v1) to define state fields with reducers.
 * Fields track messages, task metadata, guardrail limits, and per-agent outputs.
 */
export const WorkflowState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  taskId: Annotation<string>(),
  taskTitle: Annotation<string>(),
  currentAgent: Annotation<string | undefined>(),
  iterationCount: Annotation<number>({
    reducer: (curr, update) => (update !== undefined ? update : curr),
    default: () => 0,
  }),
  totalTokensUsed: Annotation<number>({
    reducer: (curr, update) => (update !== undefined ? update : curr),
    default: () => 0,
  }),
  maxIterations: Annotation<number>({
    reducer: (curr, update) => (update !== undefined ? update : curr),
    default: () => 10,
  }),
  maxTokenBudget: Annotation<number>({
    reducer: (curr, update) => (update !== undefined ? update : curr),
    default: () => 50000,
  }),
  startedAt: Annotation<number>({
    reducer: (curr, update) => (update !== undefined ? update : curr),
    default: () => Date.now(),
  }),
  maxExecutionMs: Annotation<number>({
    reducer: (curr, update) => (update !== undefined ? update : curr),
    default: () => 300000,
  }),
  status: Annotation<string>({
    reducer: (curr, update) => (update !== undefined ? update : curr),
    default: () => "running",
  }),
  agentOutputs: Annotation<
    Array<{ agentName: string; output: unknown; tokensUsed: number }>
  >({
    reducer: (curr, update) => [...curr, ...update],
    default: () => [],
  }),
});

export type WorkflowStateType = typeof WorkflowState.State;
