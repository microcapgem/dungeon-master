export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIProvider {
  name: string;
  sendMessage(messages: Message[], systemPrompt: string): Promise<string>;
  streamMessage(messages: Message[], systemPrompt: string): AsyncGenerator<string, void, unknown>;
  isConfigured(): boolean;
}

export type ProviderType = 'claude' | 'openai';
