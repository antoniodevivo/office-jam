import { z } from "zod";

export const AgentHandoffSchema = z.object({
  fromAgent: z.string().describe("Name of the agent handing off"),
  toAgent: z.string().describe("Name of the target agent"),
  context: z.string().describe("Context for the next agent"),
  completedWork: z.string().describe("Summary of completed work"),
  remainingWork: z.string().describe("What remains to be done"),
});

export type AgentHandoff = z.infer<typeof AgentHandoffSchema>;
