import { z } from 'zod';
import { LogoImage, LogoImageSchema } from '../value-objects/LogoImage.js';
import { ColorCode, ColorCodeSchema } from '../value-objects/ColorCode.js';

export const BrandingInfoSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  sessionId: z.string(),
  companyName: z.string().optional(),
  websiteUrl: z.string().url().optional(),
  logos: z.array(LogoImageSchema),
  colors: z.array(ColorCodeSchema),
  extractedAt: z.date(),
  method: z.enum(['url_scraping', 'file_upload', 'vision_ai']),
});

export type BrandingInfoData = z.infer<typeof BrandingInfoSchema>;

export class BrandingInfo {
  private constructor(
    private readonly id: string,
    private readonly userId: string | undefined,
    private readonly sessionId: string,
    private companyName: string | undefined,
    private websiteUrl: string | undefined,
    private readonly logos: LogoImage[],
    private readonly colors: ColorCode[],
    private readonly extractedAt: Date,
    private readonly method: 'url_scraping' | 'file_upload' | 'vision_ai'
  ) {}

  static create(data: {
    sessionId: string;
    userId?: string;
    companyName?: string;
    websiteUrl?: string;
    logos: LogoImage[];
    colors: ColorCode[];
    method: 'url_scraping' | 'file_upload' | 'vision_ai';
  }): BrandingInfo {
    return new BrandingInfo(
      crypto.randomUUID(),
      data.userId,
      data.sessionId,
      data.companyName,
      data.websiteUrl,
      data.logos,
      data.colors,
      new Date(),
      data.method
    );
  }

  static fromData(data: BrandingInfoData): BrandingInfo {
    BrandingInfoSchema.parse(data);
    return new BrandingInfo(
      data.id,
      data.userId,
      data.sessionId,
      data.companyName,
      data.websiteUrl,
      data.logos.map(LogoImage.create),
      data.colors.map(ColorCode.create),
      data.extractedAt,
      data.method
    );
  }

  getId(): string {
    return this.id;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  getLogos(): LogoImage[] {
    return this.logos;
  }

  getPrimaryLogo(): LogoImage | undefined {
    return this.logos[0];
  }

  getColors(): ColorCode[] {
    return this.colors;
  }

  getPrimaryColor(): ColorCode | undefined {
    return this.colors[0];
  }

  getCompanyName(): string | undefined {
    return this.companyName;
  }

  getWebsiteUrl(): string | undefined {
    return this.websiteUrl;
  }

  toJSON(): BrandingInfoData {
    return {
      id: this.id,
      userId: this.userId,
      sessionId: this.sessionId,
      companyName: this.companyName,
      websiteUrl: this.websiteUrl,
      logos: this.logos.map((l) => l.toJSON()),
      colors: this.colors.map((c) => c.toString()),
      extractedAt: this.extractedAt,
      method: this.method,
    };
  }
}


