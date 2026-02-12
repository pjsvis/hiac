import type { Message, Provider, StreamOptions } from "@src/types.ts";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

export class CloudProvider implements Provider {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string, baseUrl: string = OPENROUTER_BASE_URL) {
    this.apiKey = apiKey || process.env.OPENROUTER_API_KEY || "";
    this.baseUrl = baseUrl;

    if (!this.apiKey) {
      throw new Error(
        "OPENROUTER_API_KEY environment variable is required for cloud provider"
      );
    }
  }

  async *stream(
    messages: Message[],
    model: string,
    options?: StreamOptions
  ): AsyncIterable<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/pjsvis/hiac",
        "X-Title": "hiac CLI",
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        temperature: options?.temperature,
        max_tokens: options?.maxTokens,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OpenRouter request failed: ${response.status} ${response.statusText}\n${errorText}`
      );
    }

    if (!response.body) {
      throw new Error("No response body from OpenRouter");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;

        const data = line.slice(6);
        if (data === "[DONE]") return;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            yield content;
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }
  }
}
