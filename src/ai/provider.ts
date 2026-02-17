export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIProvider {
  name: string;
  sendMessage(messages: Message[], systemPrompt: string, maxTokens?: number): Promise<string>;
  streamMessage(messages: Message[], systemPrompt: string, maxTokens?: number): AsyncGenerator<string, void, unknown>;
  isConfigured(): boolean;
}

export type ProviderType = 'claude' | 'openai';
