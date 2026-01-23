import OpenAI from 'openai';

export class OpenAIService {
  private client: OpenAI;

  constructor(apiKey: string = process.env.OPENAI_API_KEY || '') {
    this.client = new OpenAI({ apiKey });
  }

  async chat(messages: Array<{ role: string; content: string }>, model: string = 'gpt-4o-mini'): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model,
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 1000,
    });

    return completion.choices[0]?.message?.content || '';
  }

  async *chatStream(
    messages: Array<{ role: string; content: string }>,
    model: string = 'gpt-4o-mini'
  ): AsyncIterable<string> {
    const stream = await this.client.chat.completions.create({
      model,
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 1000,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }

  async generateImage(prompt: string, model: string = 'dall-e-3'): Promise<string> {
    const response = await this.client.images.generate({
      model,
      prompt,
      n: 1,
      size: '1024x1024',
    });

    return response.data?.[0]?.url || '';
  }

  async analyzeImage(imageUrl: string, prompt: string): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ] as any,
      max_tokens: 500,
    });

    return completion.choices[0]?.message?.content || '';
  }

  async createEmbedding(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });

    return response.data[0]?.embedding || [];
  }
}

