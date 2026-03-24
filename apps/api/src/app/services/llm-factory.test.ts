import { describe, it, expect } from "vitest";
import { createChatModel } from "./llm-factory";

describe("createChatModel", () => {
  it("creates ChatOpenAI for openai provider", () => {
    const model = createChatModel({
      provider: "openai",
      model: "gpt-4o",
      apiKey: "sk-test",
    });
    expect(model).toBeDefined();
    expect(model.constructor.name).toBe("ChatOpenAI");
  });

  it("creates ChatAnthropic for anthropic provider", () => {
    const model = createChatModel({
      provider: "anthropic",
      model: "claude-sonnet-4-20250514",
      apiKey: "sk-test",
    });
    expect(model).toBeDefined();
    expect(model.constructor.name).toBe("ChatAnthropic");
  });

  it("creates ChatGoogleGenerativeAI for google provider", () => {
    const model = createChatModel({
      provider: "google",
      model: "gemini-pro",
      apiKey: "test-key",
    });
    expect(model).toBeDefined();
    expect(model.constructor.name).toBe("ChatGoogleGenerativeAI");
  });

  it("creates ChatOllama for ollama provider without API key", () => {
    const model = createChatModel({
      provider: "ollama",
      model: "llama3",
      apiKey: null,
    });
    expect(model).toBeDefined();
    expect(model.constructor.name).toBe("ChatOllama");
  });

  it("creates ChatOllama with custom baseUrl", () => {
    const model = createChatModel({
      provider: "ollama",
      model: "llama3",
      apiKey: null,
      ollamaBaseUrl: "http://remote-server:11434",
    });
    expect(model).toBeDefined();
  });

  it("throws for openai without API key", () => {
    expect(() =>
      createChatModel({ provider: "openai", model: "gpt-4o", apiKey: null })
    ).toThrow("OpenAI requires an API key");
  });

  it("throws for anthropic without API key", () => {
    expect(() =>
      createChatModel({ provider: "anthropic", model: "claude-sonnet-4-20250514", apiKey: null })
    ).toThrow("Anthropic requires an API key");
  });

  it("throws for google without API key", () => {
    expect(() =>
      createChatModel({ provider: "google", model: "gemini-pro", apiKey: null })
    ).toThrow("Google requires an API key");
  });

  it("throws for unsupported provider", () => {
    expect(() =>
      createChatModel({ provider: "unknown", model: "x", apiKey: "k" })
    ).toThrow("Unsupported LLM provider: unknown");
  });
});
