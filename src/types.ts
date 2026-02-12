export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface StreamOptions {
  temperature?: number;
  maxTokens?: number;
}

export interface Provider {
  stream(
    messages: Message[],
    model: string,
    options?: StreamOptions
  ): AsyncIterable<string>;
}

export interface Role {
  model: string;
  system: string;
  description?: string;
}

export interface CLIOptions {
  model: string;
  chat: boolean;
  select: boolean;
  listModels: boolean;
  listRoles: boolean;
  role?: string;
  brief?: string;
  playbook?: string;
  hook?: string;
  system?: string;
  prompt?: string;
}
