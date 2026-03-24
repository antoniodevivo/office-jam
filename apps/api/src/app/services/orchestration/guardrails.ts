import type { WorkflowStateType } from "./state";

export type GuardrailResult =
  | "continue"
  | "timeout"
  | "max_iterations"
  | "budget_exceeded";

/**
 * Inspect workflow state and determine if any guardrail limit has been breached.
 *
 * This function is called in TWO places:
 * 1. By execute-task.ts AFTER graph.invoke() completes -- inspects the final
 *    state to detect if the workflow hit a limit during execution.
 * 2. Can also be used as a conditional edge inside custom StateGraph topologies
 *    (not used with createSupervisor since its topology is fixed).
 *
 * Priority order: timeout > max_iterations > budget_exceeded > continue
 */
export function checkGuardrails(state: WorkflowStateType): GuardrailResult {
  const elapsed = Date.now() - state.startedAt;

  if (elapsed > state.maxExecutionMs) {
    return "timeout";
  }
  if (state.iterationCount >= state.maxIterations) {
    return "max_iterations";
  }
  if (state.totalTokensUsed >= state.maxTokenBudget) {
    return "budget_exceeded";
  }
  return "continue";
}
