import { FastifyInstance } from "fastify";
import { z } from "zod";

const ListTasksQuerySchema = z.object({
  officeId: z.string().uuid(),
});

const CreateTaskBodySchema = z.object({
  officeId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  agentIds: z.array(z.string().uuid()).optional(),
});

export default async function (fastify: FastifyInstance) {
  // GET /tasks?officeId=
  fastify.get("/", async (request, reply) => {
    const query = ListTasksQuerySchema.parse(request.query);
    const tasks = await fastify.prisma.task.findMany({
      where: { officeId: query.officeId },
      include: {
        assignments: {
          include: { agent: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return tasks;
  });

  // POST /tasks
  fastify.post("/", async (request, reply) => {
    const body = CreateTaskBodySchema.parse(request.body);

    const task = await fastify.prisma.task.create({
      data: {
        officeId: body.officeId,
        title: body.title,
        description: body.description ?? null,
      },
    });

    // Create assignments if agentIds provided
    if (body.agentIds && body.agentIds.length > 0) {
      await fastify.prisma.taskAssignment.createMany({
        data: body.agentIds.map((agentId) => ({
          taskId: task.id,
          agentId,
        })),
      });

      // Log assignment activities
      for (const agentId of body.agentIds) {
        await fastify.prisma.activity.create({
          data: {
            officeId: body.officeId,
            agentId,
            taskId: task.id,
            type: "TASK_ASSIGNED",
            payload: { taskTitle: task.title },
          },
        });
      }
    }

    // Log task created activity
    await fastify.prisma.activity.create({
      data: {
        officeId: body.officeId,
        taskId: task.id,
        type: "TASK_CREATED",
        payload: { title: task.title },
      },
    });

    // Return task with assignments
    const taskWithAssignments = await fastify.prisma.task.findUnique({
      where: { id: task.id },
      include: {
        assignments: {
          include: { agent: true },
        },
      },
    });

    reply.code(201);
    return taskWithAssignments;
  });
}
