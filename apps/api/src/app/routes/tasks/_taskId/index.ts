import { FastifyInstance } from "fastify";
import { z } from "zod";

const TaskStatusEnum = z.enum([
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
]);

const TaskParamsSchema = z.object({
  taskId: z.string().uuid(),
});

const UpdateTaskBodySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().nullable().optional(),
  status: TaskStatusEnum.optional(),
});

export default async function (fastify: FastifyInstance) {
  // GET /tasks/:taskId
  fastify.get("/", async (request, reply) => {
    const { taskId } = TaskParamsSchema.parse(request.params);
    const task = await fastify.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignments: {
          include: { agent: true },
        },
        executions: true,
      },
    });

    if (!task) {
      reply.code(404);
      return { error: "Task not found" };
    }

    return task;
  });

  // PUT /tasks/:taskId
  fastify.put("/", async (request, reply) => {
    const { taskId } = TaskParamsSchema.parse(request.params);
    const body = UpdateTaskBodySchema.parse(request.body);

    const existing = await fastify.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!existing) {
      reply.code(404);
      return { error: "Task not found" };
    }

    const task = await fastify.prisma.task.update({
      where: { id: taskId },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && {
          description: body.description,
        }),
        ...(body.status !== undefined && { status: body.status }),
      },
    });

    // Log status change activity
    if (body.status && body.status !== existing.status) {
      const activityTypeMap: Record<string, string> = {
        IN_PROGRESS: "TASK_STARTED",
        COMPLETED: "TASK_COMPLETED",
        FAILED: "TASK_FAILED",
      };
      const activityType = activityTypeMap[body.status];
      if (activityType) {
        await fastify.prisma.activity.create({
          data: {
            officeId: task.officeId,
            taskId: task.id,
            type: activityType as "TASK_STARTED" | "TASK_COMPLETED" | "TASK_FAILED",
            payload: {
              title: task.title,
              previousStatus: existing.status,
              newStatus: body.status,
            },
          },
        });
      }
    }

    return task;
  });

  // DELETE /tasks/:taskId
  fastify.delete("/", async (request, reply) => {
    const { taskId } = TaskParamsSchema.parse(request.params);

    const existing = await fastify.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!existing) {
      reply.code(404);
      return { error: "Task not found" };
    }

    await fastify.prisma.task.delete({ where: { id: taskId } });
    reply.code(204);
  });
}
