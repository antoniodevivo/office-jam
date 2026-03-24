export enum LlmProvider {
  OPENAI = "openai",
  ANTHROPIC = "anthropic",
  GOOGLE = "google",
  OLLAMA = "ollama",
}

export interface OfficeLlmConfig {
  id: string;
  officeId: string;
  defaultProvider: string;
  defaultModel: string;
  openaiApiKey: string | null;
  anthropicApiKey: string | null;
  googleApiKey: string | null;
  ollamaBaseUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOfficeLlmConfigInput {
  officeId: string;
  defaultProvider?: string;
  defaultModel?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  googleApiKey?: string;
  ollamaBaseUrl?: string;
}

export interface UpdateOfficeLlmConfigInput {
  defaultProvider?: string;
  defaultModel?: string;
  openaiApiKey?: string | null;
  anthropicApiKey?: string | null;
  googleApiKey?: string | null;
  ollamaBaseUrl?: string;
}
