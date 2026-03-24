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

const ListAgentsQuerySchema = z.object({
  officeId: z.string().uuid(),
});

const CreateAgentBodySchema = z.object({
  officeId: z.string().uuid(),
  name: z.string().min(1).max(100),
  role: AgentRoleEnum,
  systemPrompt: z.string().optional(),
  llmProvider: z.string().optional(),
  llmModel: z.string().optional(),
});

export default async function (fastify: FastifyInstance) {
  // GET /agents?officeId=
  fastify.get("/", async (request, reply) => {
    const query = ListAgentsQuerySchema.parse(request.query);
    const agents = await fastify.prisma.agent.findMany({
      where: { officeId: query.officeId },
      orderBy: { createdAt: "desc" },
    });
    return agents;
  });

  // POST /agents
  fastify.post("/", async (request, reply) => {
    const body = CreateAgentBodySchema.parse(request.body);

    // Determine LLM provider/model: use provided values or fall back to office defaults
    let llmProvider = body.llmProvider;
    let llmModel = body.llmModel;

    if (!llmProvider || !llmModel) {
      const officeConfig =
        await fastify.prisma.officeLlmConfig.findUnique({
          where: { officeId: body.officeId },
        });

      if (!llmProvider) {
        llmProvider = officeConfig?.defaultProvider ?? "openai";
      }
      if (!llmModel) {
        llmModel = officeConfig?.defaultModel ?? "gpt-4o";
      }
    }

    const agent = await fastify.prisma.agent.create({
      data: {
        officeId: body.officeId,
        name: body.name,
        role: body.role,
        systemPrompt: body.systemPrompt ?? null,
        llmProvider,
        llmModel,
      },
    });

    // Log activity
    await fastify.prisma.activity.create({
      data: {
        officeId: body.officeId,
        agentId: agent.id,
        type: "AGENT_CREATED",
        payload: { name: agent.name, role: agent.role },
      },
    });

    reply.code(201);
    return agent;
  });
}
