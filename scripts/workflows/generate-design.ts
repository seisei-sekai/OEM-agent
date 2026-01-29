#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const PROJECT_ROOT = path.join(__dirname, '../..');

interface RequirementData {
  featureName: string;
  userStory: string;
  acceptanceCriteria: string[];
  domainChanges: {
    entities: string[];
    valueObjects: string[];
    domainEvents: string[];
    services: string[];
  };
  applicationChanges: {
    useCases: string[];
    dtos: string[];
  };
  infrastructureChanges: {
    repositories: string[];
    externalServices: string[];
  };
}

async function generateDesign(featureName?: string) {
  console.log('🎨 Generating Code Design from Requirements...\n');

  try {
    // Determine feature name
    const feature = featureName || await promptForFeature();
    const featureDir = path.join(PROJECT_ROOT, 'Business/Features', feature);
    const requirementPath = path.join(featureDir, 'requirement.md');

    if (!fs.existsSync(requirementPath)) {
      console.error(`❌ Requirement file not found: ${requirementPath}`);
      console.log('   Run: pnpm workflow:new-feature [name] first');
      process.exit(1);
    }

    // Parse requirement
    console.log('📖 Parsing requirement document...');
    const requirement = parseRequirement(requirementPath);
    console.log(`   Feature: ${requirement.featureName}`);

    // Generate design document
    console.log('\n📐 Generating design document...');
    const design = generateDesignDocument(requirement);

    // Save design document
    const designPath = path.join(featureDir, 'design.md');
    fs.writeFileSync(designPath, design);
    console.log(`   ✅ Design saved: ${designPath}`);

    // Generate diagrams
    console.log('\n📊 Generating design diagrams...');
    generateDesignDiagrams(featureDir, requirement);

    console.log('\n✅ Design generation complete!');
    console.log(`📂 Output: ${featureDir}`);
    console.log('\nNext steps:');
    console.log('  1. Review design.md');
    console.log('  2. Run: pnpm workflow:generate-tests');

  } catch (error) {
    console.error('\n❌ Error generating design:', error);
    process.exit(1);
  }
}

async function promptForFeature(): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('Enter feature name: ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function parseRequirement(filePath: string): RequirementData {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  const data: RequirementData = {
    featureName: '',
    userStory: '',
    acceptanceCriteria: [],
    domainChanges: { entities: [], valueObjects: [], domainEvents: [], services: [] },
    applicationChanges: { useCases: [], dtos: [] },
    infrastructureChanges: { repositories: [], externalServices: [] },
  };

  // Extract feature name
  const featureLine = lines.find(l => l.startsWith('# Feature:'));
  if (featureLine) {
    data.featureName = featureLine.replace('# Feature:', '').trim();
  }

  // Parse sections (simplified parsing)
  let currentSection = '';
  for (const line of lines) {
    if (line.startsWith('**As a**')) {
      currentSection = 'userStory';
      data.userStory = line;
    } else if (line.startsWith('- [ ] **AC')) {
      data.acceptanceCriteria.push(line.replace('- [ ]', '').trim());
    } else if (line.includes('**Entities:**')) {
      currentSection = 'entities';
    } else if (line.includes('**Value Objects:**')) {
      currentSection = 'valueObjects';
    } else if (line.includes('**Domain Events:**')) {
      currentSection = 'domainEvents';
    } else if (line.includes('**Use Cases:**')) {
      currentSection = 'useCases';
    } else if (currentSection && line.startsWith('- [ ] `')) {
      const match = line.match(/`([^`]+)`/);
      if (match) {
        const name = match[1];
        if (currentSection === 'entities') data.domainChanges.entities.push(name);
        else if (currentSection === 'valueObjects') data.domainChanges.valueObjects.push(name);
        else if (currentSection === 'domainEvents') data.domainChanges.domainEvents.push(name);
        else if (currentSection === 'useCases') data.applicationChanges.useCases.push(name);
      }
    }
  }

  return data;
}

function generateDesignDocument(req: RequirementData): string {
  return `# Design Document: ${req.featureName}

**Generated:** ${new Date().toISOString()}

---

## Overview

${req.userStory}

## Acceptance Criteria

${req.acceptanceCriteria.map((ac, i) => `${i + 1}. ${ac}`).join('\n')}

---

## Domain Model Design

### Entities

${req.domainChanges.entities.map(entity => `#### ${entity}

\`\`\`typescript
export class ${entity} extends BaseEntity {
  // Properties
  private readonly _id: string;
  
  // Constructor
  constructor(props: ${entity}Props) {
    super();
    // TODO: Initialize properties
  }
  
  // Domain methods
  // TODO: Add business logic methods
  
  // Getters
  get id(): string {
    return this._id;
  }
}
\`\`\`

**Responsibilities:**
- TODO: Define entity responsibilities
- TODO: Define invariants

**Domain Events:**
- TODO: List events emitted by this entity

`).join('\n')}

### Value Objects

${req.domainChanges.valueObjects.map(vo => `#### ${vo}

\`\`\`typescript
export class ${vo} {
  private readonly _value: unknown;
  
  constructor(value: unknown) {
    this.validate(value);
    this._value = value;
  }
  
  private validate(value: unknown): void {
    // TODO: Validation logic
  }
  
  get value(): unknown {
    return this._value;
  }
  
  equals(other: ${vo}): boolean {
    return this._value === other._value;
  }
}
\`\`\`

**Validation Rules:**
- TODO: Define validation rules

`).join('\n')}

### Domain Events

${req.domainChanges.domainEvents.map(event => `#### ${event}

\`\`\`typescript
export class ${event} extends BaseDomainEvent {
  constructor(
    public readonly aggregateId: string,
    // TODO: Add event-specific data
  ) {
    super();
  }
}
\`\`\`

**Triggered When:**
- TODO: Describe when this event is emitted

**Consumers:**
- TODO: List who handles this event

`).join('\n')}

---

## Application Layer Design

### Use Cases

${req.applicationChanges.useCases.map(uc => `#### ${uc}

\`\`\`typescript
export class ${uc} {
  constructor(
    // TODO: Inject required repositories and services
  ) {}
  
  async execute(input: ${uc}Input): Promise<${uc}Output> {
    // TODO: Orchestrate domain operations
    // 1. Validate input
    // 2. Load aggregates
    // 3. Execute business logic
    // 4. Persist changes
    // 5. Emit events
    // 6. Return result
  }
}
\`\`\`

**Input DTO:**
\`\`\`typescript
interface ${uc}Input {
  // TODO: Define input structure
}
\`\`\`

**Output DTO:**
\`\`\`typescript
interface ${uc}Output {
  // TODO: Define output structure
}
\`\`\`

**Dependencies:**
- TODO: List required repositories
- TODO: List required services

**Flow:**
1. TODO: Step 1
2. TODO: Step 2
3. TODO: Step 3

`).join('\n')}

---

## Sequence Diagrams

### Main Use Case Flow

\`\`\`mermaid
sequenceDiagram
    participant Client
    participant UseCase
    participant Entity
    participant Repository
    participant EventBus
    
    Client->>UseCase: execute(input)
    UseCase->>Repository: findById(id)
    Repository-->>UseCase: entity
    UseCase->>Entity: performAction()
    Entity->>Entity: validate()
    Entity-->>UseCase: result
    UseCase->>Repository: save(entity)
    UseCase->>EventBus: publish(event)
    UseCase-->>Client: output
\`\`\`

---

## Data Flow

\`\`\`mermaid
graph LR
    API[API Layer] --> UseCase[Use Case]
    UseCase --> Entity[Domain Entity]
    UseCase --> Repo[Repository]
    Repo --> DB[(Database)]
    Entity --> Event[Domain Event]
    Event --> Handler[Event Handler]
\`\`\`

---

## Testing Strategy

### Unit Tests

**Domain Entities:**
- Test business logic in isolation
- Test invariant enforcement
- Test domain event emission

**Value Objects:**
- Test validation rules
- Test immutability
- Test equality

**Use Cases:**
- Test with mocked dependencies
- Test happy path
- Test error scenarios

### Integration Tests

- Test repository implementations
- Test use case with real dependencies
- Test event publishing and handling

---

## Implementation Notes

### DDD Principles

- Keep domain logic in entities/value objects
- Use cases orchestrate, don't contain business logic
- Repositories only for aggregate roots
- Domain events for decoupling

### Code Organization

\`\`\`
packages/domain/src/
  ├── entities/
  │   └── ${req.domainChanges.entities[0] || 'Entity'}.ts
  ├── value-objects/
  │   └── ${req.domainChanges.valueObjects[0] || 'ValueObject'}.ts
  └── events/
      └── ${req.domainChanges.domainEvents[0] || 'Event'}.ts

packages/application/src/
  └── use-cases/
      └── ${req.applicationChanges.useCases[0] || 'UseCase'}.ts
\`\`\`

---

**Next Step:** Generate test cases with \`pnpm workflow:generate-tests\`
`;
}

function generateDesignDiagrams(featureDir: string, req: RequirementData) {
  // Generate class diagram
  const classDiagram = `\`\`\`mermaid
classDiagram
${req.domainChanges.entities.map(e => `  class ${e} {
    <<Entity>>
    +id: string
    +method()
  }
`).join('\n')}

${req.domainChanges.valueObjects.map(vo => `  class ${vo} {
    <<Value Object>>
    -value: unknown
    +equals(other)
  }
`).join('\n')}
\`\`\``;

  fs.writeFileSync(path.join(featureDir, 'class-diagram.md'), classDiagram);
  console.log('   ✅ Class diagram generated');
}

// Main execution
const featureName = process.argv[2];
generateDesign(featureName);
