import { createSupervisor } from "@langchain/langgraph-supervisor";
import { createAgentNode } from "./agent-node";
import { createChatModel } from "../llm-factory";
import { decrypt } from "../encryption";
import { DEFAULT_GUARDRAILS } from "@office-jam/shared";
import type { GuardrailConfig } from "@office-jam/shared";

/**
 * Shape of an agent as needed by the workflow builder.
 * Matches the Prisma Agent model fields used during workflow assembly.
 */
export interface WorkflowAgent {
  id: string;
  name: string;
  role: string;
  systemPrompt: string | null;
  llmProvider: string;
  llmModel: string;
}

/**
 * Shape of a task with its agent assignments.
 * Matches what Prisma returns when including assignments with agents.
 */
export interface WorkflowTask {
  id: string;
  title: string;
  description: string | null;
  assignments: Array<{ agent: WorkflowAgent }>;
}

/**
 * Office-level LLM configuration for API key retrieval and defaults.
 */
export interface WorkflowOfficeLlmConfig {
  defaultProvider: string;
  defaultModel: string;
  openaiApiKey: string | null;
  anthropicApiKey: string | null;
  googleApiKey: string | null;
  ollamaBaseUrl: string;
}

/**
 * Returned by buildWorkflow so the caller can enforce guardrails post-invocation.
 *
 * The caller (execute-task.ts) will:
 * 1. Invoke graph with recursionLimit = guardrailConfig.maxIterations * 5
 * 2. After invoke returns, call checkGuardrails(resultState) to detect breaches
 * 3. Map the GuardrailResult to TaskExecution.status
 */
export interface WorkflowResult {
  // Compiled LangGraph graph -- typed as any because CompiledGraph generic varies
  graph: ReturnType<ReturnType<typeof createSupervisor>["compile"]>;
  guardrailConfig: GuardrailConfig;
}

/**
 * Resolve the decrypted API key for a given provider from office config.
 */
function getApiKeyForProvider(
  provider: string,
  config: WorkflowOfficeLlmConfig
): string | null {
  switch (provider) {
    case "openai":
      return config.openaiApiKey ? decrypt(config.openaiApiKey) : null;
    case "anthropic":
      return config.anthropicApiKey ? decrypt(config.anthropicApiKey) : null;
    case "google":
      return config.googleApiKey ? decrypt(config.googleApiKey) : null;
    case "ollama":
      return null; // Ollama doesn't need API keys
    default:
      return null;
  }
}

/**
 * Build a LangGraph supervisor workflow from a task and its assigned agents.
 *
 * Creates per-agent ChatModel instances (decrypting API keys from office config),
 * assembles agent nodes with role-specific system prompts, and wires them into
 * a supervisor-delegated graph.
 *
 * Returns both the compiled graph AND the guardrail config so that the caller
 * can enforce post-invocation guardrails via checkGuardrails().
 *
 * @param task - Task with agent assignments (from Prisma with includes)
 * @param officeConfig - Office-level LLM config (API keys, defaults)
 * @param guardrails - Optional guardrail overrides (merged with defaults)
 */
export async function buildWorkflow(
  task: WorkflowTask,
  officeConfig: WorkflowOfficeLlmConfig,
  guardrails?: Partial<GuardrailConfig>
): Promise<WorkflowResult> {
  if (task.assignments.length === 0) {
    throw new Error("Task must have at least one agent assignment");
  }

  const guardrailConfig: GuardrailConfig = {
    ...DEFAULT_GUARDRAILS,
    ...guardrails,
  };

  // Create compiled agent nodes from assignments
  const agentNodes = task.assignments.map(({ agent }) => {
    const apiKey = getApiKeyForProvider(agent.llmProvider, officeConfig);
    const model = createChatModel({
      provider: agent.llmProvider,
      model: agent.llmModel,
      apiKey,
      ollamaBaseUrl: officeConfig.ollamaBaseUrl,
    });

    return createAgentNode({
      name: agent.name.toLowerCase().replace(/\s+/g, "_"),
      role: agent.role,
      systemPrompt: agent.systemPrompt,
      model,
    });
  });

  // Create supervisor model (uses office default provider)
  const supervisorApiKey = getApiKeyForProvider(
    officeConfig.defaultProvider,
    officeConfig
  );
  const supervisorModel = createChatModel({
    provider: officeConfig.defaultProvider,
    model: officeConfig.defaultModel,
    apiKey: supervisorApiKey,
    ollamaBaseUrl: officeConfig.ollamaBaseUrl,
  });

  // Build supervisor workflow using createSupervisor from @langchain/langgraph-supervisor.
  // The supervisor routes work between agents based on the task description.
  // Its topology is fixed (no custom conditional edges), so guardrails are
  // enforced post-invocation by the caller via checkGuardrails().
  const workflow = createSupervisor({
    agents: agentNodes,
    llm: supervisorModel,
    prompt:
      `You are a project manager for the task: "${task.title}". ` +
      (task.description ? `Task details: ${task.description}. ` : "") +
      "Route work to the appropriate team member. " +
      "Synthesize their outputs into a final deliverable. " +
      "Delegate efficiently -- not every agent needs to be involved in every subtask.",
  });

  const graph = workflow.compile();

  return { graph, guardrailConfig };
}
