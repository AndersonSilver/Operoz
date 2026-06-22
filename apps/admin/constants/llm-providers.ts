export type TLlmProviderKey = "openai" | "anthropic" | "gemini" | "openai_compatible";

export type TLlmProviderMeta = {
  key: TLlmProviderKey;
  name: string;
  description: string;
  models: string[];
  defaultModel: string;
  apiKeyUrl: string;
  docsUrl: string;
  showBaseUrl: boolean;
  baseUrlPlaceholder: string;
};

export const CUSTOM_MODEL_VALUE = "__custom__";

export const LLM_PROVIDERS: TLlmProviderMeta[] = [
  {
    key: "openai",
    name: "OpenAI",
    description: "ChatGPT, GPT-4o e modelos oficiais da OpenAI.",
    models: ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini", "gpt-4.1", "gpt-3.5-turbo", "o1-mini", "o1-preview"],
    defaultModel: "gpt-4o-mini",
    apiKeyUrl: "https://platform.openai.com/api-keys",
    docsUrl: "https://platform.openai.com/docs/models",
    showBaseUrl: false,
    baseUrlPlaceholder: "",
  },
  {
    key: "anthropic",
    name: "Anthropic",
    description: "Claude 3.5, Haiku, Opus e demais modelos Anthropic.",
    models: [
      "claude-3-5-sonnet-20240620",
      "claude-3-5-haiku-20241022",
      "claude-3-haiku-20240307",
      "claude-3-opus-20240229",
      "claude-3-sonnet-20240229",
    ],
    defaultModel: "claude-3-5-sonnet-20240620",
    apiKeyUrl: "https://console.anthropic.com/settings/keys",
    docsUrl: "https://docs.anthropic.com/en/docs/about-claude/models",
    showBaseUrl: false,
    baseUrlPlaceholder: "",
  },
  {
    key: "gemini",
    name: "Google Gemini",
    description: "Gemini Flash e variantes via API Google AI.",
    models: ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash", "gemini-2.0-flash-lite"],
    defaultModel: "gemini-2.5-flash",
    apiKeyUrl: "https://aistudio.google.com/app/apikey",
    docsUrl: "https://ai.google.dev/gemini-api/docs/models/gemini",
    showBaseUrl: false,
    baseUrlPlaceholder: "",
  },
  {
    key: "openai_compatible",
    name: "OpenAI-compatible",
    description: "Ollama, Groq, OpenRouter, vLLM, Azure OpenAI ou qualquer API compatível.",
    models: [],
    defaultModel: "",
    apiKeyUrl: "https://openrouter.ai/keys",
    docsUrl: "https://github.com/openai/openai-python#microsoft-azure-openai",
    showBaseUrl: true,
    baseUrlPlaceholder: "https://api.openrouter.ai/v1",
  },
];

export function getLlmProvider(key: string | undefined): TLlmProviderMeta {
  return LLM_PROVIDERS.find((p) => p.key === key) ?? LLM_PROVIDERS[0];
}
