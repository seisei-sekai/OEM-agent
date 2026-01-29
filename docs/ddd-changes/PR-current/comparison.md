# DDD Changes - PR current

**Generated:** 1/30/2026, 4:15:39 AM  
**Base Branch:** main

## Summary

- **Total Files Changed:** 121
- **Lines Added:** +15645
- **Lines Deleted:** -234
- **Domain Changes:** 5
- **Application Changes:** 3
- **Infrastructure Changes:** 7
- **Test Changes:** 10

## DDD Component Changes

### Domain Layer

#### Entities

**Added:**
- ✅ `Message` (packages/domain/src/entities/Message.ts)


#### Value Objects

**Added:**
- ✅ `Timestamp` (packages/domain/src/value-objects/Timestamp.ts)


#### Domain Services

No changes.


### Application Layer

#### Use Cases

No changes.

#### DTOs

No changes.


### Infrastructure Layer

#### Repositories

No changes.

#### Infrastructure Services

No changes.


### Tests

#### Test Files

**Added:**
- ✅ `LoadChatHistoryUseCase.test` (packages/application/src/use-cases/__tests__/LoadChatHistoryUseCase.test.ts)
- ✅ `Message.test` (packages/domain/src/entities/__tests__/Message.test.ts)
- ✅ `Timestamp.test` (packages/domain/src/value-objects/__tests__/Timestamp.test.ts)
- ✅ `graph.integration.test` (packages/infrastructure/src/agent/__tests__/graph.integration.test.ts)
- ✅ `integration.generateMockup.test` (packages/infrastructure/src/agent/__tests__/integration.generateMockup.test.ts)
- ✅ `sse.mockup.test` (packages/infrastructure/src/agent/__tests__/sse.mockup.test.ts)

**Modified:**
- 🔄 `health.test` (apps/api/src/routes/__tests__/health.test.ts)
- 🔄 `SendMessageUseCase.test` (packages/application/src/use-cases/__tests__/SendMessageUseCase.test.ts)
- 🔄 `intentClassificationNode.test` (packages/infrastructure/src/agent/nodes/__tests__/intentClassificationNode.test.ts)
- 🔄 `MockupGeneratorService.test` (packages/infrastructure/src/ai/__tests__/MockupGeneratorService.test.ts)



## Visual Comparison

### Stakeholder Summary
| Before | After |
|--------|-------|
| ![Before](./before/stakeholder-summary.svg) | ![After](./after/stakeholder-summary.svg) |

### Domain Model
| Before | After |
|--------|-------|
| ![Before](./before/domain-model.svg) | ![After](./after/domain-model.svg) |

### Use Case Catalog
| Before | After |
|--------|-------|
| ![Before](./before/use-case-catalog.svg) | ![After](./after/use-case-catalog.svg) |

### Bounded Context Map
| Before | After |
|--------|-------|
| ![Before](./before/bounded-context-map.svg) | ![After](./after/bounded-context-map.svg) |

---

**Note:** Red indicates deletions, Green indicates additions, Yellow indicates modifications.
