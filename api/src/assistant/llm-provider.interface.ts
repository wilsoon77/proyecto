export type LlmRole = 'system' | 'user' | 'assistant' | 'tool';

export type LlmToolCall = {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
};

export type LlmMessage = {
  role: LlmRole;
  content?: string | null;
  name?: string;
  tool_call_id?: string;
  tool_calls?: LlmToolCall[];
};

export type LlmTool = {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

export type LlmResponse = {
  choices?: Array<{
    message?: LlmMessage;
    finish_reason?: string;
  }>;
};

export type LlmProviderName = 'gemini' | 'groq' | 'mistral' | 'nvidia';

export interface LlmProvider {
  readonly name: LlmProviderName;
  isConfigured(): boolean;
  call(messages: LlmMessage[], tools: LlmTool[]): Promise<LlmResponse>;
}
