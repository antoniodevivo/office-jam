import { describe, it, expect, vi, beforeEach } from "vitest";
import { executeTask } from "./execute-task";

// Mock workflow builder -- returns { graph, guardrailConfig }
vi.mock("./workflow", () => ({
  buildWorkflow: vi.fn(),
}));

// Mock guardrails
vi.mock("./guardrails", () => ({
  checkGuardrails: vi.fn(() => "continue"),
}));

function createMockPrisma() {
  return {
    task: {
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
    },
    taskExecution: {
      create: vi.fn(() => ({ id: "exec-1" })),
      update: vi.fn(),
    },
    officeLlmConfig: {
      findUnique: vi.fn(() => null),
    },
    activity: {
      create: vi.fn(),
    },
  };
}

const mockTaskData = {
  id: "task-1",
  officeId: "office-1",
  title: "Test",
  description: null,
  assignments: [
    {
      agent: {
        id: "a1",
        name: "Dev",
        role: "DEVELOPER",
        systemPrompt: null,
        llmProvider: "ollama",
        llmModel: "llama3",
      },
    },
  ],
};

describe("executeTask", () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    vi.clearAllMocks();
  });

  it("throws when task has no assignments", async () => {
    mockPrisma.task.findUniqueOrThrow.mockResolvedValue({
      ...mockTaskData,
      assignments: [],
    });

    await expect(
      executeTask({ taskId: "task-1", prisma: mockPrisma as any })
    ).rejects.toThrow("Task task-1 has no agent assignments");
  });

  it("creates TaskExecution record with status running", async () => {
    const { buildWorkflow } = await import("./workflow");
    (buildWorkflow as any).mockResolvedValue({
      graph: {
        invoke: vi.fn().mockResolvedValue({
          messages: [],
          iterationCount: 3,
          totalTokensUsed: 1500,
        }),
      },
      guardrailConfig: {
        maxIterations: 10,
        maxExecutionMs: 300000,
        maxTokenBudget: 50000,
      },
    });

    mockPrisma.task.findUniqueOrThrow.mockResolvedValue(mockTaskData);

    await executeTask({ taskId: "task-1", prisma: mockPrisma as any });

    expect(mockPrisma.taskExecution.create).toHaveBeenCalledWith({
      data: { taskId: "task-1", status: "running" },
    });
  });

  it("updates task to IN_PROGRESS then COMPLETED on success", async () => {
    const { buildWorkflow } = await import("./workflow");
    (buildWorkflow as any).mockResolvedValue({
      graph: {
        invoke: vi.fn().mockResolvedValue({
          messages: [],
          iterationCount: 2,
          totalTokensUsed: 800,
        }),
      },
      guardrailConfig: {
        maxIterations: 10,
        maxExecutionMs: 300000,
        maxTokenBudget: 50000,
      },
    });

    mockPrisma.task.findUniqueOrThrow.mockResolvedValue(mockTaskData);

    await executeTask({ taskId: "task-1", prisma: mockPrisma as any });

    // First update: IN_PROGRESS
    expect(mockPrisma.task.update).toHaveBeenCalledWith({
      where: { id: "task-1" },
      data: { status: "IN_PROGRESS" },
    });

    // Second update: COMPLETED
    expect(mockPrisma.task.update).toHaveBeenCalledWith({
      where: { id: "task-1" },
      data: { status: "COMPLETED" },
    });
  });

  it("persists iterationCount and totalTokensUsed on success", async () => {
    const { buildWorkflow } = await import("./workflow");
    (buildWorkflow as any).mockResolvedValue({
      graph: {
        invoke: vi.fn().mockResolvedValue({
          messages: [],
          iterationCount: 5,
          totalTokensUsed: 12345,
        }),
      },
      guardrailConfig: {
        maxIterations: 10,
        maxExecutionMs: 300000,
        maxTokenBudget: 50000,
      },
    });

    mockPrisma.task.findUniqueOrThrow.mockResolvedValue(mockTaskData);

    await executeTask({ taskId: "task-1", prisma: mockPrisma as any });

    expect(mockPrisma.taskExecution.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "completed",
          iterationCount: 5,
          totalTokensUsed: 12345,
        }),
      })
    );
  });

  it("calls checkGuardrails on result state and maps breach to execution status", async () => {
    const { buildWorkflow } = await import("./workflow");
    const { checkGuardrails } = await import("./guardrails");

    (buildWorkflow as any).mockResolvedValue({
      graph: {
        invoke: vi.fn().mockResolvedValue({
          messages: [],
          iterationCount: 10,
          totalTokensUsed: 8000,
          startedAt: Date.now() - 400000,
          maxExecutionMs: 300000,
          maxIterations: 10,
          maxTokenBudget: 50000,
        }),
      },
      guardrailConfig: {
        maxIterations: 10,
        maxExecutionMs: 300000,
        maxTokenBudget: 50000,
      },
    });

    // Simulate guardrail breach
    (checkGuardrails as any).mockReturnValue("timeout");

    mockPrisma.task.findUniqueOrThrow.mockResolvedValue(mockTaskData);

    await executeTask({ taskId: "task-1", prisma: mockPrisma as any });

    expect(checkGuardrails).toHaveBeenCalled();

    // TaskExecution should be updated with "timeout" status
    expect(mockPrisma.taskExecution.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "timeout",
          iterationCount: 10,
          totalTokensUsed: 8000,
          error: "Guardrail breached: timeout",
        }),
      })
    );

    // Task should be FAILED
    expect(mockPrisma.task.update).toHaveBeenCalledWith({
      where: { id: "task-1" },
      data: { status: "FAILED" },
    });
  });

  it("updates task to FAILED on workflow error", async () => {
    const { buildWorkflow } = await import("./workflow");
    (buildWorkflow as any).mockResolvedValue({
      graph: {
        invoke: vi.fn().mockRejectedValue(new Error("LLM failed")),
      },
      guardrailConfig: {
        maxIterations: 10,
        maxExecutionMs: 300000,
        maxTokenBudget: 50000,
      },
    });

    mockPrisma.task.findUniqueOrThrow.mockResolvedValue(mockTaskData);

    await executeTask({ taskId: "task-1", prisma: mockPrisma as any });

    expect(mockPrisma.task.update).toHaveBeenCalledWith({
      where: { id: "task-1" },
      data: { status: "FAILED" },
    });

    expect(mockPrisma.taskExecution.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "failed",
          error: "LLM failed",
        }),
      })
    );
  });

  it("logs TASK_STARTED and TASK_COMPLETED activities", async () => {
    const { buildWorkflow } = await import("./workflow");
    const { checkGuardrails } = await import("./guardrails");
    (checkGuardrails as any).mockReturnValue("continue");
    (buildWorkflow as any).mockResolvedValue({
      graph: {
        invoke: vi.fn().mockResolvedValue({
          messages: [],
          iterationCount: 1,
          totalTokensUsed: 500,
        }),
      },
      guardrailConfig: {
        maxIterations: 10,
        maxExecutionMs: 300000,
        maxTokenBudget: 50000,
      },
    });

    mockPrisma.task.findUniqueOrThrow.mockResolvedValue(mockTaskData);

    await executeTask({ taskId: "task-1", prisma: mockPrisma as any });

    const activityCalls = mockPrisma.activity.create.mock.calls;
    expect(
      activityCalls.some((c: any) => c[0].data.type === "TASK_STARTED")
    ).toBe(true);
    expect(
      activityCalls.some((c: any) => c[0].data.type === "TASK_COMPLETED")
    ).toBe(true);
  });
});
