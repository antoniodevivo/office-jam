import { z } from "zod";

export const TaskOutputSchema = z.object({
  summary: z.string().describe("Brief summary of what was accomplished"),
  details: z.string().describe("Detailed output from the agent"),
  confidence: z.number().min(0).max(1).describe("Confidence level 0-1"),
  suggestions: z
    .array(z.string())
    .optional()
    .describe("Follow-up suggestions"),
});

export type TaskOutput = z.infer<typeof TaskOutputSchema>;
