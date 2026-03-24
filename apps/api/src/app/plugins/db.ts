import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";
import { prisma } from "@office-jam/db";
import type { PrismaClient } from "@office-jam/db";

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

export default fp(async function dbPlugin(fastify: FastifyInstance) {
  fastify.decorate("prisma", prisma);

  fastify.addHook("onClose", async () => {
    await prisma.$disconnect();
  });
});
