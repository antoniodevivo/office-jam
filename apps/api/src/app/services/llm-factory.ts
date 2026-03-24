import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOllama } from "@langchain/ollama";

export interface LlmFactoryParams {
  provider: string;
  model: string;
  apiKey: string | null;
  ollamaBaseUrl?: string;
}

export function createChatModel(params: LlmFactoryParams): BaseChatModel {
  const { provider, model, apiKey, ollamaBaseUrl } = params;

  switch (provider) {
    case "openai":
      if (!apiKey) throw new Error("OpenAI requires an API key");
      return new ChatOpenAI({ model, apiKey });

    case "anthropic":
      if (!apiKey) throw new Error("Anthropic requires an API key");
      return new ChatAnthropic({ model, apiKey });

    case "google":
      if (!apiKey) throw new Error("Google requires an API key");
      return new ChatGoogleGenerativeAI({ model, apiKey });

    case "ollama":
      return new ChatOllama({
        model,
        baseUrl: ollamaBaseUrl ?? "http://127.0.0.1:11434",
      });

    default:
      throw new Error(`Unsupported LLM provider: ${provider}`);
  }
}
