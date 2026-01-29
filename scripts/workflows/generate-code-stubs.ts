#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = path.join(__dirname, '../..');

async function generateCodeStubs(featureName?: string) {
  console.log('🏗️  Generating Code Stubs from Design...\n');

  try {
    const feature = featureName || process.argv[2];
    if (!feature) {
      console.error('❌ Feature name required');
      console.log('Usage: pnpm workflow:generate-stubs [feature-name]');
      process.exit(1);
    }

    const featureDir = path.join(PROJECT_ROOT, 'Business/Features', feature);
    const designPath = path.join(featureDir, 'design.md');

    if (!fs.existsSync(designPath)) {
      console.error(`❌ Design file not found: ${designPath}`);
      process.exit(1);
    }

    console.log('📖 Parsing design document...');
    const design = fs.readFileSync(designPath, 'utf-8');
    const components = parseDesign(design);

    // Generate entity stubs
    console.log('\n🏗️  Generating entity stubs...');
    for (const entity of components.entities) {
      generateEntityStub(entity);
    }

    // Generate value object stubs
    console.log('\n🏗️  Generating value object stubs...');
    for (const vo of components.valueObjects) {
      generateValueObjectStub(vo);
    }

    // Generate use case stubs
    console.log('\n🏗️  Generating use case stubs...');
    for (const uc of components.useCases) {
      generateUseCaseStub(uc);
    }

    console.log('\n✅ Code stub generation complete!');
    console.log('\nNext steps:');
    console.log('  1. Run: pnpm test (should fail - this is good!)');
    console.log('  2. Implement the TODO comments in generated files');
    console.log('  3. Re-run tests until they pass');
    console.log('  4. Run: pnpm workflow:prepare-pr');

  } catch (error) {
    console.error('\n❌ Error generating stubs:', error);
    process.exit(1);
  }
}

function parseDesign(content: string) {
  const components = {
    entities: [] as string[],
    valueObjects: [] as string[],
    useCases: [] as string[],
  };

  const entityMatches = content.matchAll(/export class (\w+) extends BaseEntity/g);
  for (const match of entityMatches) {
    components.entities.push(match[1]);
  }

  const voMatches = content.matchAll(/export class (\w+) \{[^}]*private readonly _value/gs);
  for (const match of voMatches) {
    if (!components.entities.includes(match[1])) {
      components.valueObjects.push(match[1]);
    }
  }

  const ucMatches = content.matchAll(/#### (\w+UseCase)/g);
  for (const match of ucMatches) {
    components.useCases.push(match[1]);
  }

  return components;
}

function generateEntityStub(entityName: string) {
  const stubContent = `import { BaseEntity } from '../base/BaseEntity';

export interface ${entityName}Props {
  // TODO: Define entity properties
  id?: string;
}

/**
 * ${entityName} Entity
 * 
 * Responsibilities:
 * - TODO: Document entity responsibilities
 * 
 * Invariants:
 * - TODO: Document business invariants
 */
export class ${entityName} extends BaseEntity {
  private readonly _id: string;
  // TODO: Add private fields

  constructor(props: ${entityName}Props) {
    super();
    this._id = props.id || this.generateId();
    // TODO: Initialize properties
    // TODO: Validate invariants
  }

  // Domain Methods
  // TODO: Implement business logic methods

  /**
   * Example domain method
   */
  public performAction(): void {
    // TODO: Implement business logic
    throw new Error('Method not implemented');
  }

  // Getters
  get id(): string {
    return this._id;
  }

  // TODO: Add more getters

  // Helper methods
  private generateId(): string {
    return \`\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`;
  }
}
`;

  const stubPath = path.join(PROJECT_ROOT, 'packages/domain/src/entities', `${entityName}.ts`);
  fs.mkdirSync(path.dirname(stubPath), { recursive: true });
  
  if (!fs.existsSync(stubPath)) {
    fs.writeFileSync(stubPath, stubContent);
    console.log(`   ✅ Generated: ${entityName}.ts`);
  } else {
    console.log(`   ⚠️  Skipped: ${entityName}.ts (already exists)`);
  }
}

function generateValueObjectStub(voName: string) {
  const stubContent = `/**
 * ${voName} Value Object
 * 
 * Validation Rules:
 * - TODO: Document validation rules
 * 
 * Immutable: Yes
 */
export class ${voName} {
  private readonly _value: unknown; // TODO: Specify proper type

  constructor(value: unknown) {
    this.validate(value);
    this._value = value;
  }

  private validate(value: unknown): void {
    // TODO: Implement validation logic
    if (!value) {
      throw new Error(\`Invalid ${voName}: value is required\`);
    }
    
    // TODO: Add more validation rules
  }

  get value(): unknown {
    return this._value;
  }

  public equals(other: ${voName}): boolean {
    return this._value === other._value;
  }

  public toString(): string {
    return String(this._value);
  }
}
`;

  const stubPath = path.join(PROJECT_ROOT, 'packages/domain/src/value-objects', `${voName}.ts`);
  fs.mkdirSync(path.dirname(stubPath), { recursive: true });
  
  if (!fs.existsSync(stubPath)) {
    fs.writeFileSync(stubPath, stubContent);
    console.log(`   ✅ Generated: ${voName}.ts`);
  } else {
    console.log(`   ⚠️  Skipped: ${voName}.ts (already exists)`);
  }
}

function generateUseCaseStub(ucName: string) {
  const inputType = `${ucName}Input`;
  const outputType = `${ucName}Output`;

  const stubContent = `export interface ${inputType} {
  // TODO: Define input structure
}

export interface ${outputType} {
  // TODO: Define output structure
}

/**
 * ${ucName}
 * 
 * Responsibilities:
 * - TODO: Document use case responsibilities
 * 
 * Flow:
 * 1. TODO: Step 1
 * 2. TODO: Step 2
 * 3. TODO: Step 3
 */
export class ${ucName} {
  constructor(
    // TODO: Inject required repositories and services
    // private readonly repository: IRepository,
    // private readonly service: IService,
  ) {}

  async execute(input: ${inputType}): Promise<${outputType} {
    // TODO: Implement use case logic
    
    // 1. Validate input
    this.validateInput(input);
    
    // 2. Load required aggregates
    // const entity = await this.repository.findById(input.id);
    
    // 3. Execute domain operations
    // entity.performAction();
    
    // 4. Persist changes
    // await this.repository.save(entity);
    
    // 5. Emit events (if any)
    // await this.publishEvents(entity.domainEvents);
    
    // 6. Return result
    throw new Error('Method not implemented');
  }

  private validateInput(input: ${inputType}): void {
    // TODO: Implement input validation
    if (!input) {
      throw new Error('Input is required');
    }
  }
}
`;

  const stubPath = path.join(PROJECT_ROOT, 'packages/application/src/use-cases', `${ucName}.ts`);
  fs.mkdirSync(path.dirname(stubPath), { recursive: true });
  
  if (!fs.existsSync(stubPath)) {
    fs.writeFileSync(stubPath, stubContent);
    console.log(`   ✅ Generated: ${ucName}.ts`);
  } else {
    console.log(`   ⚠️  Skipped: ${ucName}.ts (already exists)`);
  }
}

// Main execution
generateCodeStubs();
