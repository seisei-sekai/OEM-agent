#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = path.join(__dirname, '../..');

async function generateTests(featureName?: string) {
  console.log('🧪 Generating Test Cases from Design...\n');

  try {
    const feature = featureName || process.argv[2];
    if (!feature) {
      console.error('❌ Feature name required');
      console.log('Usage: pnpm workflow:generate-tests [feature-name]');
      process.exit(1);
    }

    const featureDir = path.join(PROJECT_ROOT, 'Business/Features', feature);
    const designPath = path.join(featureDir, 'design.md');

    if (!fs.existsSync(designPath)) {
      console.error(`❌ Design file not found: ${designPath}`);
      console.log('   Run: pnpm workflow:generate-design first');
      process.exit(1);
    }

    console.log('📖 Parsing design document...');
    const design = fs.readFileSync(designPath, 'utf-8');
    const components = parseDesign(design);

    console.log(`   Found ${components.entities.length} entities`);
    console.log(`   Found ${components.valueObjects.length} value objects`);
    console.log(`   Found ${components.useCases.length} use cases`);

    // Generate entity tests
    console.log('\n🧪 Generating entity tests...');
    for (const entity of components.entities) {
      generateEntityTest(entity);
    }

    // Generate value object tests
    console.log('\n🧪 Generating value object tests...');
    for (const vo of components.valueObjects) {
      generateValueObjectTest(vo);
    }

    // Generate use case tests
    console.log('\n🧪 Generating use case tests...');
    for (const uc of components.useCases) {
      generateUseCaseTest(uc);
    }

    // Create test plan
    const testPlanPath = path.join(featureDir, 'test-plan.md');
    generateTestPlan(testPlanPath, components);

    console.log('\n✅ Test generation complete!');
    console.log(`📂 Tests generated in respective __tests__ directories`);
    console.log(`📋 Test plan: ${testPlanPath}`);
    console.log('\nNext steps:');
    console.log('  1. Review generated tests');
    console.log('  2. Run: pnpm workflow:generate-stubs');
    console.log('  3. Run: pnpm test (tests should fail)');

  } catch (error) {
    console.error('\n❌ Error generating tests:', error);
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

function generateEntityTest(entityName: string) {
  const testContent = `import { describe, it, expect } from 'vitest';
import { ${entityName} } from '../${entityName}';

describe('${entityName}', () => {
  describe('Creation', () => {
    it('should create a valid ${entityName}', () => {
      // Arrange
      const props = {
        // TODO: Add required properties
      };

      // Act
      const entity = new ${entityName}(props);

      // Assert
      expect(entity).toBeDefined();
      expect(entity.id).toBeDefined();
      // TODO: Add more assertions
    });

    it('should throw error for invalid properties', () => {
      // Arrange
      const invalidProps = {
        // TODO: Add invalid properties
      };

      // Act & Assert
      expect(() => new ${entityName}(invalidProps)).toThrow();
    });
  });

  describe('Business Logic', () => {
    it('should perform domain operation correctly', () => {
      // Arrange
      const entity = createValid${entityName}();

      // Act
      // TODO: Call domain method
      // entity.performAction();

      // Assert
      // TODO: Verify business logic
    });

    it('should enforce invariants', () => {
      // Arrange
      const entity = createValid${entityName}();

      // Act & Assert
      // TODO: Try to violate invariant
      expect(() => {
        // entity.invalidOperation();
      }).toThrow();
    });
  });

  describe('Domain Events', () => {
    it('should emit domain event on state change', () => {
      // Arrange
      const entity = createValid${entityName}();

      // Act
      // TODO: Perform action that emits event
      // entity.performAction();

      // Assert
      // TODO: Verify event was emitted
      // expect(entity.domainEvents).toHaveLength(1);
    });
  });
});

function createValid${entityName}(): ${entityName} {
  return new ${entityName}({
    // TODO: Add valid properties
  });
}
`;

  const testPath = path.join(PROJECT_ROOT, 'packages/domain/src/entities/__tests__', `${entityName}.test.ts`);
  fs.mkdirSync(path.dirname(testPath), { recursive: true });
  fs.writeFileSync(testPath, testContent);
  console.log(`   ✅ Generated: ${entityName}.test.ts`);
}

function generateValueObjectTest(voName: string) {
  const testContent = `import { describe, it, expect } from 'vitest';
import { ${voName} } from '../${voName}';

describe('${voName}', () => {
  describe('Creation and Validation', () => {
    it('should create with valid value', () => {
      // Arrange
      const validValue = 'TODO: valid value';

      // Act
      const vo = new ${voName}(validValue);

      // Assert
      expect(vo).toBeDefined();
      expect(vo.value).toBe(validValue);
    });

    it('should reject invalid value', () => {
      // Arrange
      const invalidValue = 'TODO: invalid value';

      // Act & Assert
      expect(() => new ${voName}(invalidValue)).toThrow();
    });

    it('should handle edge cases', () => {
      // TODO: Test edge cases
      // - Empty string
      // - Very long string
      // - Special characters
      // - Null/undefined
    });
  });

  describe('Equality', () => {
    it('should be equal to another ${voName} with same value', () => {
      // Arrange
      const value = 'TODO: value';
      const vo1 = new ${voName}(value);
      const vo2 = new ${voName}(value);

      // Act & Assert
      expect(vo1.equals(vo2)).toBe(true);
    });

    it('should not be equal to ${voName} with different value', () => {
      // Arrange
      const vo1 = new ${voName}('TODO: value1');
      const vo2 = new ${voName}('TODO: value2');

      // Act & Assert
      expect(vo1.equals(vo2)).toBe(false);
    });
  });

  describe('Immutability', () => {
    it('should not allow modification after creation', () => {
      // Arrange
      const vo = new ${voName}('TODO: value');

      // Act & Assert
      // Value object should be immutable
      expect(() => {
        (vo as any).value = 'new value';
      }).toThrow();
    });
  });
});
`;

  const testPath = path.join(PROJECT_ROOT, 'packages/domain/src/value-objects/__tests__', `${voName}.test.ts`);
  fs.mkdirSync(path.dirname(testPath), { recursive: true });
  fs.writeFileSync(testPath, testContent);
  console.log(`   ✅ Generated: ${voName}.test.ts`);
}

function generateUseCaseTest(ucName: string) {
  const testContent = `import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ${ucName} } from '../${ucName}';

describe('${ucName}', () => {
  // Mocks
  let mockRepository: any;
  let mockService: any;
  let useCase: ${ucName};

  beforeEach(() => {
    // Setup mocks
    mockRepository = {
      findById: vi.fn(),
      save: vi.fn(),
      // TODO: Add more repository methods
    };

    mockService = {
      // TODO: Add service methods
    };

    useCase = new ${ucName}(
      mockRepository,
      mockService
      // TODO: Add more dependencies
    );
  });

  describe('Happy Path', () => {
    it('should execute use case successfully', async () => {
      // Arrange
      const input = {
        // TODO: Add input data
      };

      mockRepository.findById.mockResolvedValue({
        // TODO: Mock entity
      });

      mockRepository.save.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result).toBeDefined();
      expect(mockRepository.findById).toHaveBeenCalledTimes(1);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      // TODO: Add more assertions
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid input', async () => {
      // Arrange
      const invalidInput = {
        // TODO: Invalid input
      };

      // Act & Assert
      await expect(useCase.execute(invalidInput)).rejects.toThrow();
    });

    it('should handle entity not found', async () => {
      // Arrange
      const input = {
        // TODO: Input
      };

      mockRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow('not found');
    });

    it('should handle repository errors', async () => {
      // Arrange
      const input = {
        // TODO: Input
      };

      mockRepository.findById.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow();
    });
  });

  describe('Business Rules', () => {
    it('should enforce business rule', async () => {
      // Arrange
      const input = {
        // TODO: Input that violates business rule
      };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow();
    });
  });

  describe('Integration', () => {
    it('should publish domain events', async () => {
      // Arrange
      const input = {
        // TODO: Input
      };

      mockRepository.findById.mockResolvedValue({
        // TODO: Mock entity with events
        domainEvents: [],
      });

      // Act
      await useCase.execute(input);

      // Assert
      // TODO: Verify events were published
    });
  });
});
`;

  const testPath = path.join(PROJECT_ROOT, 'packages/application/src/use-cases/__tests__', `${ucName}.test.ts`);
  fs.mkdirSync(path.dirname(testPath), { recursive: true });
  fs.writeFileSync(testPath, testContent);
  console.log(`   ✅ Generated: ${ucName}.test.ts`);
}

function generateTestPlan(testPlanPath: string, components: any) {
  const content = `# Test Plan

**Generated:** ${new Date().toISOString()}

---

## Test Coverage

### Domain Layer

#### Entities (${components.entities.length})
${components.entities.map(e => `- [ ] ${e}
  - [ ] Creation tests
  - [ ] Business logic tests
  - [ ] Invariant tests
  - [ ] Domain event tests
`).join('\n')}

#### Value Objects (${components.valueObjects.length})
${components.valueObjects.map(vo => `- [ ] ${vo}
  - [ ] Validation tests
  - [ ] Equality tests
  - [ ] Immutability tests
`).join('\n')}

### Application Layer

#### Use Cases (${components.useCases.length})
${components.useCases.map(uc => `- [ ] ${uc}
  - [ ] Happy path test
  - [ ] Error handling tests
  - [ ] Business rule tests
  - [ ] Integration tests
`).join('\n')}

---

## Test Execution Plan

1. **Unit Tests First**
   - Run domain entity tests
   - Run value object tests
   - Fix any failing tests

2. **Use Case Tests**
   - Run with mocked dependencies
   - Verify orchestration logic
   - Fix any failing tests

3. **Integration Tests**
   - Test with real dependencies
   - Test database operations
   - Test external services

4. **Coverage Check**
   - Ensure >80% coverage
   - Review uncovered code
   - Add missing tests

---

## Test Commands

\`\`\`bash
# Run all tests
pnpm test

# Run with coverage
pnpm test --coverage

# Run specific test file
pnpm test ${components.entities[0] || 'Entity'}.test.ts

# Watch mode
pnpm test:watch
\`\`\`

---

**Next:** Implement code stubs to make tests compile
`;

  fs.writeFileSync(testPlanPath, content);
  console.log(`   ✅ Test plan generated`);
}

// Main execution
generateTests();
