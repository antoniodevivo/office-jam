import {
  buildWorkflow,
  WorkflowOfficeLlmConfig,
} from "./workflow";
import { checkGuardrails } from "./guardrails";
import { HumanMessage } from "@langchain/core/messages";
import type { PrismaClient } from "@office-jam/db";

interface ExecuteTaskParams {
  taskId: string;
  prisma: PrismaClient;
  guardrails?: {
    maxIterations?: number;
    maxExecutionMs?: number;
    maxTokenBudget?: number;
  };
}

/**
 * Fire-and-forget task execution function.
 *
 * Called by the execute route without being awaited. Runs the full workflow:
 * 1. Creates TaskExecution record and updates Task to IN_PROGRESS
 * 2. Builds and invokes the LangGraph workflow
 * 3. After invoke returns, calls checkGuardrails(resultState) to detect breaches
 * 4. Persists result with iterationCount and totalTokensUsed
 * 5. Updates Task to COMPLETED or FAILED based on outcome
 */
export async function executeTask(params: ExecuteTaskParams): Promise<void> {
  const { taskId, prisma, guardrails } = params;

  // Fetch task with assignments and agents
  const task = await prisma.task.findUniqueOrThrow({
    where: { id: taskId },
    include: {
      assignments: {
        include: { agent: true },
      },
    },
  });

  if (task.assignments.length === 0) {
    throw new Error(`Task ${taskId} has no agent assignments`);
  }

  // Create execution record
  const execution = await prisma.taskExecution.create({
    data: { taskId, status: "running" },
  });

  // Update task to IN_PROGRESS
  await prisma.task.update({
    where: { id: taskId },
    data: { status: "IN_PROGRESS" },
  });

  // Log activity
  await prisma.activity.create({
    data: {
      officeId: task.officeId,
      taskId,
      type: "TASK_STARTED",
      payload: { executionId: execution.id },
    },
  });

  try {
    // Get office LLM config
    const officeConfig = await prisma.officeLlmConfig.findUnique({
      where: { officeId: task.officeId },
    });

    const llmConfig: WorkflowOfficeLlmConfig = officeConfig ?? {
      defaultProvider: "openai",
      defaultModel: "gpt-4o",
      openaiApiKey: null,
      anthropicApiKey: null,
      googleApiKey: null,
      ollamaBaseUrl: "http://127.0.0.1:11434",
    };

    // Build workflow -- returns { graph, guardrailConfig }
    const { graph, guardrailConfig } = await buildWorkflow(
      {
        id: task.id,
        title: task.title,
        description: task.description,
        assignments: task.assignments,
      },
      llmConfig,
      guardrails
    );

    // Invoke the graph with recursionLimit as hard safety net
    const result = await graph.invoke(
      {
        messages: [
          new HumanMessage(
            `Task: ${task.title}\n${task.description ?? "No additional details."}`
          ),
        ],
        startedAt: Date.now(),
        maxIterations: guardrailConfig.maxIterations,
        maxTokenBudget: guardrailConfig.maxTokenBudget,
        maxExecutionMs: guardrailConfig.maxExecutionMs,
      },
      {
        recursionLimit: Math.max(guardrailConfig.maxIterations * 5, 50),
      }
    );

    // --- POST-INVOCATION GUARDRAIL CHECK ---
    // checkGuardrails inspects the final state to detect if any limit was breached
    const guardrailResult = checkGuardrails(result);

    if (guardrailResult === "continue") {
      // Clean success -- no guardrail breached
      await prisma.taskExecution.update({
        where: { id: execution.id },
        data: {
          status: "completed",
          iterationCount: result.iterationCount ?? 0,
          totalTokensUsed: result.totalTokensUsed ?? 0,
          result:
            result.messages?.map((m: { _getType?: () => string; content: unknown }) => ({
              role: m._getType?.() ?? "unknown",
              content:
                typeof m.content === "string"
                  ? m.content
                  : JSON.stringify(m.content),
            })) ?? null,
          completedAt: new Date(),
        },
      });

      await prisma.task.update({
        where: { id: taskId },
        data: { status: "COMPLETED" },
      });

      await prisma.activity.create({
        data: {
          officeId: task.officeId,
          taskId,
          type: "TASK_COMPLETED",
          payload: { executionId: execution.id },
        },
      });
    } else {
      // Guardrail breached -- map result to status
      const statusMap: Record<string, string> = {
        timeout: "timeout",
        max_iterations: "timeout",
        budget_exceeded: "budget_exceeded",
      };
      const executionStatus = statusMap[guardrailResult] ?? "failed";

      await prisma.taskExecution.update({
        where: { id: execution.id },
        data: {
          status: executionStatus,
          iterationCount: result.iterationCount ?? 0,
          totalTokensUsed: result.totalTokensUsed ?? 0,
          error: `Guardrail breached: ${guardrailResult}`,
          result:
            result.messages?.map((m: { _getType?: () => string; content: unknown }) => ({
              role: m._getType?.() ?? "unknown",
              content:
                typeof m.content === "string"
                  ? m.content
                  : JSON.stringify(m.content),
            })) ?? null,
          completedAt: new Date(),
        },
      });

      await prisma.task.update({
        where: { id: taskId },
        data: { status: "FAILED" },
      });

      await prisma.activity.create({
        data: {
          officeId: task.officeId,
          taskId,
          type: "TASK_FAILED",
          payload: {
            executionId: execution.id,
            reason: guardrailResult,
            iterationCount: result.iterationCount ?? 0,
            totalTokensUsed: result.totalTokensUsed ?? 0,
          },
        },
      });
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);

    // Determine status based on error
    let status = "failed";
    if (
      errorMessage.includes("GraphRecursionError") ||
      errorMessage.includes("recursion")
    ) {
      status = "timeout";
    }

    await prisma.taskExecution.update({
      where: { id: execution.id },
      data: {
        status,
        error: errorMessage,
        completedAt: new Date(),
      },
    });

    await prisma.task.update({
      where: { id: taskId },
      data: { status: "FAILED" },
    });

    await prisma.activity.create({
      data: {
        officeId: task.officeId,
        taskId,
        type: "TASK_FAILED",
        payload: { executionId: execution.id, error: errorMessage },
      },
    });
  }
}
