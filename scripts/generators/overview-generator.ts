import { DomainData, ApplicationData } from '../types';

export function generateOverview(
  domainData: DomainData,
  applicationData: ApplicationData
): string {
  return `graph TB
    subgraph DomainLayer["Domain Layer - 领域层"]
        Entities["${domainData.entities.length} Entities<br/>${domainData.entities.map((e) => e.name).join(', ')}"]
        ValueObjects["${domainData.valueObjects.length} Value Objects<br/>${domainData.valueObjects.map((vo) => vo.name).join(', ')}"]
        Events["${domainData.domainEvents.length} Domain Events<br/>${domainData.domainEvents.map((e) => e.name).join(', ')}"]
        Services["${domainData.domainServices.length} Domain Services<br/>${domainData.domainServices.map((s) => s.name).join(', ')}"]
    end
    
    subgraph ApplicationLayer["Application Layer - 应用层"]
        UseCases["${applicationData.useCases.length} Use Cases<br/>${applicationData.useCases.map((uc) => uc.name).join(', ')}"]
        DTOs["${applicationData.dtos.length} DTOs"]
    end
    
    subgraph InfrastructureLayer["Infrastructure Layer - 基础设施层"]
        Repositories["Repository Implementations"]
        ExternalServices["External Services<br/>OpenAI, Weaviate, MongoDB"]
    end
    
    UseCases --> Entities
    UseCases --> ValueObjects
    Repositories --> Entities
    ExternalServices --> Repositories
    
    style DomainLayer fill:#ffcccc
    style ApplicationLayer fill:#ccffcc
    style InfrastructureLayer fill:#ccccff
`;
}
