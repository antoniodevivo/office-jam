import { createAgent } from "langchain";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { CompiledStateGraph } from "@langchain/langgraph";

/**
 * Role-specific system prompts for each agent role.
 * These provide baseline instructions that shape agent behavior.
 */
const ROLE_PROMPTS: Record<string, string> = {
  CEO: "You are the CEO. You provide strategic direction, make final decisions, and ensure the team stays aligned with the overall vision.",
  CTO: "You are the CTO. You make technical architecture decisions, evaluate technology choices, and guide the development strategy.",
  DEVELOPER:
    "You are a senior software developer. You write code, debug issues, design solutions, and implement features.",
  DESIGNER:
    "You are a UI/UX designer. You create user interfaces, improve user experience, and ensure visual consistency.",
  MARKETING:
    "You are a marketing specialist. You create marketing strategies, write copy, and plan campaigns.",
  LEGAL:
    "You are a legal advisor. You review compliance, draft policies, and identify legal risks.",
  CUSTOM:
    "You are a specialized team member. Follow your custom instructions carefully.",
};

export interface AgentNodeConfig {
  name: string;
  role: string;
  systemPrompt: string | null;
  model: BaseChatModel;
}

/**
 * Creates a compiled agent node for use in a LangGraph supervisor workflow.
 *
 * Uses `createAgent` from langchain to build a ReactAgent, then compiles its
 * internal StateGraph builder with the agent name so that createSupervisor
 * can identify and route to this agent.
 *
 * @returns A CompiledStateGraph that can be passed to createSupervisor's agents array
 */
export function createAgentNode(config: AgentNodeConfig): CompiledStateGraph {
  const { name, role, systemPrompt, model } = config;

  const basePrompt = ROLE_PROMPTS[role] ?? ROLE_PROMPTS.CUSTOM;
  const fullPrompt = systemPrompt
    ? `${basePrompt}\n\nAdditional instructions: ${systemPrompt}`
    : basePrompt;

  const agent = createAgent({
    model,
    name,
    systemPrompt: fullPrompt,
    tools: [],
  });

  // createSupervisor expects CompiledStateGraph with a name property.
  // ReactAgent has a .builder (StateGraph) that we compile with the agent name.
  return agent.builder.compile({ name });
}
