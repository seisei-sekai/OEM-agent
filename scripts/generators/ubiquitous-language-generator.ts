import { DomainData } from '../types';

export function generateUbiquitousLanguage(domainData: DomainData): string {
  return `graph TB
    subgraph Entities["Entities"]
        ${domainData.entities
          .map(
            (e) =>
              `${e.name}["${e.name}<br/>${e.isAggregateRoot ? 'Aggregate Root' : 'Entity'}<br/>${e.properties.length} properties"]`
          )
          .join('\n        ')}
    end
    
    subgraph ValueObjects["Value Objects"]
        ${domainData.valueObjects
          .map((vo) => `${vo.name}["${vo.name}<br/>Value Object<br/>Immutable"]`)
          .join('\n        ')}
    end
    
    subgraph DomainEvents["Domain Events"]
        ${domainData.domainEvents
          .map((e) => `${e.name}["${e.name}<br/>Domain Event<br/>Event"]`)
          .join('\n        ')}
    end
    
    subgraph DomainServices["Domain Services"]
        ${domainData.domainServices
          .map((s) => `${s.name}["${s.name}<br/>Domain Service<br/>Pure Logic"]`)
          .join('\n        ')}
    end
    
    subgraph Repositories["Repository Interfaces"]
        ${domainData.repositories
          .map((r) => `${r.name}["${r.name}<br/>Repository Interface<br/>for ${r.targetEntity}"]`)
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
