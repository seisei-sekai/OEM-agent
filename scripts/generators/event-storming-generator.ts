import { DomainData } from '../types';

export function generateEventStorming(domainData: DomainData): string {
  const events = domainData.domainEvents;

  return `timeline
    title Event Storming - Domain Event Flow
    
    section User Entry - 用户进入
      User visits website : Page loads
      Floating button appears : UI renders
    
    section Start Conversation - 开始对话
      ${events.find((e) => e.name.includes('SessionStarted')) ? `User clicks button : ${events.find((e) => e.name.includes('SessionStarted'))!.name} event` : 'User clicks button : Session starts'}
      Welcome screen shows : Quick action cards
    
    section Branding Extraction - 品牌提取
      User selects branded merch : Enters branding flow
      User provides URL or file : Triggers extraction
      ${events.find((e) => e.name.includes('BrandingExtracted')) ? `System extracts branding : ${events.find((e) => e.name.includes('BrandingExtracted'))!.name} event` : 'System extracts branding : Branding ready'}
    
    section Product Recommendation - 产品推荐
      User confirms logo : Triggers recommendation
      System generates mockups : Calls AI service
      ${events.find((e) => e.name.includes('ProductsRecommended')) ? `Products displayed : ${events.find((e) => e.name.includes('ProductsRecommended'))!.name} event` : 'Products displayed : Recommendations shown'}
    
    section Refinement - 精细化
      User views products : Browse interactions
      User loads more : Pagination request
      User selects product : View details
      
    section All Events - 所有领域事件
      ${events.map((e) => `${e.name} : Domain event`).join('\n      ')}
`;
}
