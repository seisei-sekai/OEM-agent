import { DomainData } from '../types';

export function generateUbiquitousLanguage(domainData: DomainData): string {
  return `graph TB
    subgraph Entities["Entities - 实体"]
        ${domainData.entities
          .map(
            (e) =>
              `${e.name}["${e.name}<br/>${e.isAggregateRoot ? '聚合根 (Aggregate Root)' : '实体 (Entity)'}<br/>${e.properties.length} properties"]`
          )
          .join('\n        ')}
    end
    
    subgraph ValueObjects["Value Objects - 值对象"]
        ${domainData.valueObjects
          .map((vo) => `${vo.name}["${vo.name}<br/>值对象<br/>Immutable"]`)
          .join('\n        ')}
    end
    
    subgraph DomainEvents["Domain Events - 领域事件"]
        ${domainData.domainEvents
          .map((e) => `${e.name}["${e.name}<br/>领域事件<br/>Event"]`)
          .join('\n        ')}
    end
    
    subgraph DomainServices["Domain Services - 领域服务"]
        ${domainData.domainServices
          .map((s) => `${s.name}["${s.name}<br/>领域服务<br/>Pure Logic"]`)
          .join('\n        ')}
    end
    
    subgraph Repositories["Repository Interfaces - 仓储接口"]
        ${domainData.repositories
          .map((r) => `${r.name}["${r.name}<br/>仓储接口<br/>for ${r.targetEntity}"]`)
          .join('\n        ')}
    end
    
    ${domainData.entities
      .flatMap((e) =>
        e.relationships.map((rel) => `${e.name} -->|${rel.type}| ${rel.target}`)
      )
      .join('\n    ')}
    
    style Entities fill:#ffcccc
    style ValueObjects fill:#ffe6cc
    style DomainEvents fill:#ccffcc
    style DomainServices fill:#ccccff
    style Repositories fill:#e6ccff
`;
}
