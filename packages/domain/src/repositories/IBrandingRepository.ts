import { BrandingInfo } from '../entities/BrandingInfo.js';

export interface IBrandingRepository {
  save(branding: BrandingInfo): Promise<void>;
  findById(id: string): Promise<BrandingInfo | null>;
  findBySessionId(sessionId: string): Promise<BrandingInfo | null>;
  findByUserId(userId: string): Promise<BrandingInfo[]>;
}


