import { FastifyInstance } from "fastify";
import { z } from "zod";

const AgentRoleEnum = z.enum([
  "CEO",
  "CTO",
  "DEVELOPER",
  "DESIGNER",
  "MARKETING",
  "LEGAL",
  "CUSTOM",
]);

const AgentParamsSchema = z.object({
  agentId: z.string().uuid(),
});

const UpdateAgentBodySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  role: AgentRoleEnum.optional(),
  systemPrompt: z.string().nullable().optional(),
  llmProvider: z.string().optional(),
  llmModel: z.string().optional(),
});

export default async function (fastify: FastifyInstance) {
  // GET /agents/:agentId
  fastify.get("/", async (request, reply) => {
    const { agentId } = AgentParamsSchema.parse(request.params);
    const agent = await fastify.prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      reply.code(404);
      return { error: "Agent not found" };
    }

    return agent;
  });

  // PUT /agents/:agentId
  fastify.put("/", async (request, reply) => {
    const { agentId } = AgentParamsSchema.parse(request.params);
    const body = UpdateAgentBodySchema.parse(request.body);

    const existing = await fastify.prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!existing) {
      reply.code(404);
      return { error: "Agent not found" };
    }

    const agent = await fastify.prisma.agent.update({
      where: { id: agentId },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.role !== undefined && { role: body.role }),
        ...(body.systemPrompt !== undefined && {
          systemPrompt: body.systemPrompt,
        }),
        ...(body.llmProvider !== undefined && {
          llmProvider: body.llmProvider,
        }),
        ...(body.llmModel !== undefined && { llmModel: body.llmModel }),
      },
    });

    return agent;
  });

  // DELETE /agents/:agentId
  fastify.delete("/", async (request, reply) => {
    const { agentId } = AgentParamsSchema.parse(request.params);

    const existing = await fastify.prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!existing) {
      reply.code(404);
      return { error: "Agent not found" };
    }

    await fastify.prisma.agent.delete({ where: { id: agentId } });
    reply.code(204);
  });
}
