import { DomainData, ApplicationData } from '../types';

export function generateStakeholderSummary(
  domainData: DomainData,
  applicationData: ApplicationData
): string {
  const aggregates = domainData.entities.filter((e) => e.isAggregateRoot);

  return `graph TB
    subgraph Context["System Context"]
        BC["OEM Agent Context<br/>Single Bounded Context"]
    end
    
    subgraph Subdomains["Sub-domains"]
        Conv["Conversation Management<br/>${domainData.entities.filter((e) => e.name.includes('Session') || e.name.includes('Message')).length} entities"]
        Prod["Product Catalog<br/>${domainData.entities.filter((e) => e.name.includes('Product')).length} entities"]
        Brand["Branding Extraction<br/>${domainData.entities.filter((e) => e.name.includes('Branding')).length} entities"]
        Cost["Cost Calculation<br/>${domainData.domainServices.length} services"]
    end
    
    subgraph Aggregates["Key Aggregates"]
        ${aggregates
          .map(
            (agg, idx) =>
              `AG${idx + 1}["${agg.name}<br/>${agg.properties.length} properties<br/>${agg.methods.length} methods"]`
          )
          .join('\n        ')}
    end
    
    subgraph UseCases["Core Use Cases"]
        UC1["${applicationData.useCases.length} Use Cases"]
        UC2["Complete User Journey"]
    end
    
    subgraph Events["Domain Events"]
        EV1["${domainData.domainEvents.length} Events"]
        EV2["Event Sourcing Support"]
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
