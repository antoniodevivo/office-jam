import { describe, it, expect, vi, beforeEach } from "vitest";
import type { WorkflowTask, WorkflowOfficeLlmConfig } from "./workflow";

// Mock createAgent from langchain -- returns a ReactAgent-like object
// whose builder can be compiled into a named CompiledStateGraph
const mockCompile = vi.fn().mockReturnValue({ name: "mock_compiled" });
const mockBuilder = { compile: mockCompile };
vi.mock("langchain", () => ({
  createAgent: vi.fn(() => ({
    builder: mockBuilder,
  })),
}));

// Mock createSupervisor to return a StateGraph-like object with compile()
const mockGraphInvoke = vi.fn();
const mockSupervisorCompile = vi.fn().mockReturnValue({
  invoke: mockGraphInvoke,
  name: "supervisor",
});
vi.mock("@langchain/langgraph-supervisor", () => ({
  createSupervisor: vi.fn(() => ({
    compile: mockSupervisorCompile,
  })),
}));

// Mock the LLM factory to avoid real provider instantiation
vi.mock("../llm-factory", () => ({
  createChatModel: vi.fn(() => ({
    invoke: vi.fn(),
    constructor: { name: "MockChatModel" },
  })),
}));

// Mock encryption
vi.mock("../encryption", () => ({
  decrypt: vi.fn((val: string) => `decrypted_${val}`),
}));

const mockConfig: WorkflowOfficeLlmConfig = {
  defaultProvider: "openai",
  defaultModel: "gpt-4o",
  openaiApiKey: "encrypted_key",
  anthropicApiKey: null,
  googleApiKey: null,
  ollamaBaseUrl: "http://127.0.0.1:11434",
};

const mockTask: WorkflowTask = {
  id: "task-1",
  title: "Test Task",
  description: "Test description",
  assignments: [
    {
      agent: {
        id: "agent-1",
        name: "Dev Agent",
        role: "DEVELOPER",
        systemPrompt: null,
        llmProvider: "openai",
        llmModel: "gpt-4o",
      },
    },
  ],
};

describe("buildWorkflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when task has no assignments", async () => {
    const { buildWorkflow } = await import("./workflow");
    const emptyTask = { ...mockTask, assignments: [] };
    await expect(buildWorkflow(emptyTask, mockConfig)).rejects.toThrow(
      "Task must have at least one agent assignment"
    );
  });

  it("calls createChatModel for each agent and the supervisor", async () => {
    const { buildWorkflow } = await import("./workflow");
    const { createChatModel } = await import("../llm-factory");
    await buildWorkflow(mockTask, mockConfig);
    // Called once for the agent + once for the supervisor = 2
    expect(createChatModel).toHaveBeenCalledTimes(2);
  });

  it("decrypts API keys before passing to LLM factory", async () => {
    const { buildWorkflow } = await import("./workflow");
    const { decrypt } = await import("../encryption");
    await buildWorkflow(mockTask, mockConfig);
    expect(decrypt).toHaveBeenCalledWith("encrypted_key");
  });

  it("does not decrypt null API keys", async () => {
    const { buildWorkflow } = await import("./workflow");
    const { decrypt } = await import("../encryption");
    const anthropicTask: WorkflowTask = {
      ...mockTask,
      assignments: [
        {
          agent: {
            ...mockTask.assignments[0].agent,
            llmProvider: "anthropic",
          },
        },
      ],
    };
    const configWithNoAnthropicKey = { ...mockConfig, openaiApiKey: null };
    await buildWorkflow(anthropicTask, configWithNoAnthropicKey);
    // decrypt should not be called for null anthropicApiKey
    // It may be called for supervisor's openai key if openai key exists
    // But with openaiApiKey: null, no calls
    expect(decrypt).not.toHaveBeenCalled();
  });

  it("returns guardrailConfig with defaults when none provided", async () => {
    const { buildWorkflow } = await import("./workflow");
    const result = await buildWorkflow(mockTask, mockConfig);
    expect(result.guardrailConfig).toBeDefined();
    expect(result.guardrailConfig.maxIterations).toBe(10);
    expect(result.guardrailConfig.maxExecutionMs).toBe(300000);
    expect(result.guardrailConfig.maxTokenBudget).toBe(50000);
  });

  it("returns guardrailConfig with custom overrides when provided", async () => {
    const { buildWorkflow } = await import("./workflow");
    const result = await buildWorkflow(mockTask, mockConfig, {
      maxIterations: 5,
      maxTokenBudget: 10000,
    });
    expect(result.guardrailConfig.maxIterations).toBe(5);
    expect(result.guardrailConfig.maxTokenBudget).toBe(10000);
    expect(result.guardrailConfig.maxExecutionMs).toBe(300000); // unchanged default
  });

  it("returns a compiled graph", async () => {
    const { buildWorkflow } = await import("./workflow");
    const result = await buildWorkflow(mockTask, mockConfig);
    expect(result.graph).toBeDefined();
    expect(mockSupervisorCompile).toHaveBeenCalled();
  });

  it("calls createSupervisor with agent nodes and supervisor model", async () => {
    const { buildWorkflow } = await import("./workflow");
    const { createSupervisor } = await import(
      "@langchain/langgraph-supervisor"
    );
    await buildWorkflow(mockTask, mockConfig);
    expect(createSupervisor).toHaveBeenCalledWith(
      expect.objectContaining({
        agents: expect.any(Array),
        llm: expect.any(Object),
        prompt: expect.stringContaining("Test Task"),
      })
    );
  });

  it("normalizes agent names to lowercase with underscores", async () => {
    const { buildWorkflow } = await import("./workflow");
    const { createAgent } = await import("langchain");
    await buildWorkflow(mockTask, mockConfig);
    // "Dev Agent" should become "dev_agent"
    expect(createAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "dev_agent",
      })
    );
  });
});
