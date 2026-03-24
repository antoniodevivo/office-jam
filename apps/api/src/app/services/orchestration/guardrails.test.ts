import { describe, it, expect } from "vitest";
import { checkGuardrails } from "./guardrails";
import type { WorkflowStateType } from "./state";

function makeState(
  overrides: Partial<Record<string, unknown>> = {}
): WorkflowStateType {
  return {
    messages: [],
    taskId: "test-task",
    taskTitle: "Test",
    currentAgent: undefined,
    iterationCount: 0,
    totalTokensUsed: 0,
    maxIterations: 10,
    maxTokenBudget: 50000,
    startedAt: Date.now(),
    maxExecutionMs: 300000,
    status: "running",
    agentOutputs: [],
    ...overrides,
  } as WorkflowStateType;
}

describe("checkGuardrails", () => {
  it("returns 'continue' when all limits are within bounds", () => {
    const result = checkGuardrails(makeState());
    expect(result).toBe("continue");
  });

  it("returns 'timeout' when execution time exceeds maxExecutionMs", () => {
    const result = checkGuardrails(
      makeState({
        startedAt: Date.now() - 400000,
        maxExecutionMs: 300000,
      })
    );
    expect(result).toBe("timeout");
  });

  it("returns 'max_iterations' when iterationCount reaches maxIterations", () => {
    const result = checkGuardrails(
      makeState({
        iterationCount: 10,
        maxIterations: 10,
      })
    );
    expect(result).toBe("max_iterations");
  });

  it("returns 'budget_exceeded' when totalTokensUsed reaches maxTokenBudget", () => {
    const result = checkGuardrails(
      makeState({
        totalTokensUsed: 50000,
        maxTokenBudget: 50000,
      })
    );
    expect(result).toBe("budget_exceeded");
  });

  it("timeout takes priority over iteration limit", () => {
    const result = checkGuardrails(
      makeState({
        startedAt: Date.now() - 400000,
        maxExecutionMs: 300000,
        iterationCount: 10,
        maxIterations: 10,
      })
    );
    expect(result).toBe("timeout");
  });

  it("iteration limit takes priority over budget when timeout not hit", () => {
    const result = checkGuardrails(
      makeState({
        iterationCount: 10,
        maxIterations: 10,
        totalTokensUsed: 50000,
        maxTokenBudget: 50000,
      })
    );
    expect(result).toBe("max_iterations");
  });
});
