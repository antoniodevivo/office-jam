import { FastifyInstance } from "fastify";
import { z } from "zod";
import { encrypt } from "../../../services/encryption";

const OfficeParamsSchema = z.object({
  officeId: z.string().uuid(),
});

const UpdateLlmConfigBodySchema = z.object({
  defaultProvider: z.string().optional(),
  defaultModel: z.string().optional(),
  openaiApiKey: z.string().nullable().optional(),
  anthropicApiKey: z.string().nullable().optional(),
  googleApiKey: z.string().nullable().optional(),
  ollamaBaseUrl: z.string().url().optional(),
});

export default async function (fastify: FastifyInstance) {
  // GET /offices/:officeId/llm-config
  fastify.get("/", async (request, reply) => {
    const { officeId } = OfficeParamsSchema.parse(request.params);

    const config = await fastify.prisma.officeLlmConfig.findUnique({
      where: { officeId },
    });

    if (!config) {
      return {
        officeId,
        defaultProvider: "openai",
        defaultModel: "gpt-4o",
        hasOpenaiKey: false,
        hasAnthropicKey: false,
        hasGoogleKey: false,
        ollamaBaseUrl: "http://127.0.0.1:11434",
      };
    }

    return {
      id: config.id,
      officeId: config.officeId,
      defaultProvider: config.defaultProvider,
      defaultModel: config.defaultModel,
      hasOpenaiKey: !!config.openaiApiKey,
      hasAnthropicKey: !!config.anthropicApiKey,
      hasGoogleKey: !!config.googleApiKey,
      ollamaBaseUrl: config.ollamaBaseUrl,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  });

  // PUT /offices/:officeId/llm-config
  fastify.put("/", async (request, reply) => {
    const { officeId } = OfficeParamsSchema.parse(request.params);
    const body = UpdateLlmConfigBodySchema.parse(request.body);

    // Build the data object, encrypting API keys
    const data: Record<string, unknown> = {};

    if (body.defaultProvider !== undefined) {
      data.defaultProvider = body.defaultProvider;
    }
    if (body.defaultModel !== undefined) {
      data.defaultModel = body.defaultModel;
    }
    if (body.ollamaBaseUrl !== undefined) {
      data.ollamaBaseUrl = body.ollamaBaseUrl;
    }

    // Handle API key fields: null clears, string encrypts, undefined skips
    if (body.openaiApiKey !== undefined) {
      data.openaiApiKey =
        body.openaiApiKey === null ? null : encrypt(body.openaiApiKey);
    }
    if (body.anthropicApiKey !== undefined) {
      data.anthropicApiKey =
        body.anthropicApiKey === null ? null : encrypt(body.anthropicApiKey);
    }
    if (body.googleApiKey !== undefined) {
      data.googleApiKey =
        body.googleApiKey === null ? null : encrypt(body.googleApiKey);
    }

    const config = await fastify.prisma.officeLlmConfig.upsert({
      where: { officeId },
      create: { officeId, ...data },
      update: data,
    });

    return {
      id: config.id,
      officeId: config.officeId,
      defaultProvider: config.defaultProvider,
      defaultModel: config.defaultModel,
      hasOpenaiKey: !!config.openaiApiKey,
      hasAnthropicKey: !!config.anthropicApiKey,
      hasGoogleKey: !!config.googleApiKey,
      ollamaBaseUrl: config.ollamaBaseUrl,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  });
}
