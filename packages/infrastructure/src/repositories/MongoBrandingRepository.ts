import { Collection } from 'mongodb';
import { BrandingInfo, IBrandingRepository, BrandingInfoData } from '@repo/domain';
import { getDB } from '../database/mongodb.js';

export class MongoBrandingRepository implements IBrandingRepository {
  private get collection(): Collection<BrandingInfoData> {
    return getDB().collection<BrandingInfoData>('branding_info');
  }

  async save(branding: BrandingInfo): Promise<void> {
    const data = branding.toJSON();
    await this.collection.updateOne(
      { id: data.id },
      { $set: data },
      { upsert: true }
    );
  }

  async findById(id: string): Promise<BrandingInfo | null> {
    const data = await this.collection.findOne({ id });
    if (!data) return null;
    return BrandingInfo.fromData(data);
  }

  async findBySessionId(sessionId: string): Promise<BrandingInfo | null> {
    const data = await this.collection.findOne({ sessionId });
    if (!data) return null;
    return BrandingInfo.fromData(data);
  }

  async findByUserId(userId: string): Promise<BrandingInfo[]> {
    const docs = await this.collection
      .find({ userId })
      .sort({ extractedAt: -1 })
      .toArray();
    
    return docs.map(doc => BrandingInfo.fromData(doc));
  }
}



