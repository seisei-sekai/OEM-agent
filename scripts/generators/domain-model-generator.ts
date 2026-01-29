import { DomainData } from '../types';

export function generateDomainModel(domainData: DomainData): string {
  return `classDiagram
    ${domainData.entities
      .map(
        (entity) => `
    class ${entity.name} {
        ${entity.isAggregateRoot ? '<<Aggregate Root>>' : '<<Entity>>'}
        ${entity.properties.slice(0, 5).map((p) => `+${p.type} ${p.name}`).join('\n        ')}
        ${entity.methods.slice(0, 3).map((m) => `+${m.name}(${m.parameters.map((p) => p.name).join(', ')})`).join('\n        ')}
    }
    `
      )
      .join('\n')}
    
    ${domainData.valueObjects
      .map(
        (vo) => `
    class ${vo.name} {
        <<Value Object>>
        ${vo.properties.map((p) => `+${p.type} ${p.name}`).join('\n        ')}
        ${vo.methods.slice(0, 2).map((m) => `+${m.name}()`).join('\n        ')}
    }
    `
      )
      .join('\n')}
    
    ${domainData.entities
      .flatMap((e) =>
        e.relationships.map((rel) => {
          if (rel.cardinality === '*') {
            return `${e.name} "1" o-- "${rel.cardinality}" ${rel.target}`;
          } else {
            return `${e.name} --> ${rel.target}`;
          }
        })
      )
      .join('\n    ')}
`;
}
