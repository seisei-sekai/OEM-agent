import { z } from 'zod';

export const LogoImageSchema = z.object({
  url: z.string().url(),
  width: z.number().positive(),
  height: z.number().positive(),
  format: z.enum(['png', 'jpg', 'jpeg', 'svg', 'webp']),
});

export type LogoImageData = z.infer<typeof LogoImageSchema>;

export class LogoImage {
  private constructor(
    private readonly url: string,
    private readonly width: number,
    private readonly height: number,
    private readonly format: string
  ) {}

  static create(data: LogoImageData): LogoImage {
    const validated = LogoImageSchema.parse(data);
    return new LogoImage(
      validated.url,
      validated.width,
      validated.height,
      validated.format
    );
  }

  getUrl(): string {
    return this.url;
  }

  getDimensions(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }

  getFormat(): string {
    return this.format;
  }

  getAspectRatio(): number {
    return this.width / this.height;
  }

  toJSON(): LogoImageData {
    return {
      url: this.url,
      width: this.width,
      height: this.height,
      format: this.format as any,
    };
  }
}


