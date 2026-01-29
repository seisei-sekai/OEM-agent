import { DomainData } from '../types';

export function generateAggregateDesign(domainData: DomainData): string {
  const aggregates = domainData.entities.filter((e) => e.isAggregateRoot);

  return `classDiagram
    ${aggregates
      .map((agg) => {
        const relatedEntities = domainData.entities.filter((e) =>
          agg.relationships.some((rel) => rel.target === e.name)
        );

        return `
    class ${agg.name} {
        <<Aggregate Root>>
        ${agg.properties.map((p) => `+${p.type} ${p.name}`).join('\n        ')}
        ${agg.methods.map((m) => `+${m.name}()`).join('\n        ')}
    }
    
    ${relatedEntities
      .map(
        (entity) => `
    class ${entity.name} {
        <<Entity>>
        ${entity.properties.map((p) => `+${p.type} ${p.name}`).join('\n        ')}
        ${entity.methods.map((m) => `+${m.name}()`).join('\n        ')}
    }
    `
      )
      .join('\n')}
    
    ${agg.relationships
      .map((rel) => {
        if (rel.cardinality === '*') {
          return `${agg.name} "1" *-- "${rel.cardinality}" ${rel.target}`;
        } else {
          return `${agg.name} --> ${rel.target}`;
        }
      })
      .join('\n    ')}
        `;
      })
      .join('\n')}
`;
}
