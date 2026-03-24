import { FastifyInstance } from "fastify";
import { z } from "zod";
import { executeTask } from "../../../services/orchestration/execute-task";

const ExecuteParamsSchema = z.object({
  taskId: z.string().uuid(),
});

const ExecuteBodySchema = z
  .object({
    maxIterations: z.number().int().min(1).max(100).optional(),
    maxExecutionMs: z.number().int().min(10000).max(600000).optional(),
    maxTokenBudget: z.number().int().min(1000).max(500000).optional(),
  })
  .optional();

export default async function (fastify: FastifyInstance) {
  // POST /tasks/:taskId/execute
  fastify.post("/", async (request, reply) => {
    const { taskId } = ExecuteParamsSchema.parse(request.params);
    const guardrails = ExecuteBodySchema.parse(request.body ?? {});

    // Validate task exists and has assignments
    const task = await fastify.prisma.task.findUnique({
      where: { id: taskId },
      include: { assignments: true },
    });

    if (!task) {
      return reply.code(404).send({ error: "Task not found" });
    }

    if (task.status === "IN_PROGRESS") {
      return reply.code(409).send({ error: "Task is already executing" });
    }

    if (task.assignments.length === 0) {
      return reply.code(400).send({ error: "Task has no agent assignments" });
    }

    // Fire and forget -- do NOT await
    executeTask({
      taskId,
      prisma: fastify.prisma,
      guardrails,
    }).catch((err) => {
      fastify.log.error({ err, taskId }, "Task execution failed unexpectedly");
    });

    return reply.code(202).send({
      taskId,
      status: "IN_PROGRESS",
      message: "Task execution started",
    });
  });
}
