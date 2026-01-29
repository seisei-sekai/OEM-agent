import { DomainData, ApplicationData } from '../types';

export function generateStakeholderSummary(
  domainData: DomainData,
  applicationData: ApplicationData
): string {
  const aggregates = domainData.entities.filter((e) => e.isAggregateRoot);

  return `graph TB
    subgraph Context["System Context - 系统上下文"]
        BC["OEM Agent Context<br/>核心有界上下文<br/>单一bounded context"]
    end
    
    subgraph Subdomains["Sub-domains - 子域划分"]
        Conv["Conversation Management<br/>会话管理<br/>${domainData.entities.filter((e) => e.name.includes('Session') || e.name.includes('Message')).length} entities"]
        Prod["Product Catalog<br/>产品目录<br/>${domainData.entities.filter((e) => e.name.includes('Product')).length} entities"]
        Brand["Branding Extraction<br/>品牌提取<br/>${domainData.entities.filter((e) => e.name.includes('Branding')).length} entities"]
        Cost["Cost Calculation<br/>成本计算<br/>${domainData.domainServices.length} services"]
    end
    
    subgraph Aggregates["Key Aggregates - 关键聚合"]
        ${aggregates
          .map(
            (agg, idx) =>
              `AG${idx + 1}["${agg.name}<br/>${agg.properties.length} properties<br/>${agg.methods.length} methods"]`
          )
          .join('\n        ')}
    end
    
    subgraph UseCases["Core Use Cases - 核心用例"]
        UC1["${applicationData.useCases.length} Use Cases"]
        UC2["Complete User Journey<br/>完整用户旅程"]
    end
    
    subgraph Events["Domain Events - 领域事件"]
        EV1["${domainData.domainEvents.length} Events"]
        EV2["Event Sourcing Support<br/>支持事件溯源"]
    end
    
    BC --> Conv
    BC --> Prod
    BC --> Brand
    BC --> Cost
    
    ${aggregates.map((_, idx) => `Conv --> AG${idx + 1}`).join('\n    ')}
    
    style Context fill:#e1f5ff
    style Subdomains fill:#fff4e6
    style Aggregates fill:#ffcccc
    style UseCases fill:#ccffcc
    style Events fill:#ffe6cc
`;
}
