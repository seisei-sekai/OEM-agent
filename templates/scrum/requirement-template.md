# Feature: [Feature Name]

**Created:** [DATE]  
**Sprint:** [Sprint Number]  
**Priority:** [High/Medium/Low]  
**Notion Link:** [Link to Notion page]

---

## User Story

**As a** [role/persona]  
**I want** [feature/capability]  
**So that** [benefit/value]

## Acceptance Criteria

- [ ] **AC1:** [First acceptance criterion]
- [ ] **AC2:** [Second acceptance criterion]
- [ ] **AC3:** [Third acceptance criterion]
- [ ] **AC4:** [Additional criterion as needed]

## Technical Requirements

### Domain Layer Changes

**Entities:**
- [ ] `EntityName` - [Description of the entity and its responsibility]
  - Properties: [list key properties]
  - Methods: [list key methods]

**Value Objects:**
- [ ] `ValueObjectName` - [Description and validation rules]
  - Properties: [immutable properties]

**Domain Events:**
- [ ] `EventName` - [When this event is triggered]
  - Payload: [event data]

**Domain Services:**
- [ ] `ServiceName` - [Business logic that doesn't fit in entities]
  - Methods: [list methods]

### Application Layer Changes

**Use Cases:**
- [ ] `UseCaseName` - [Describe the use case flow]
  - Input: [DTO or parameters]
  - Output: [DTO or result]
  - Dependencies: [list required repositories/services]

**DTOs:**
- [ ] `DTOName` - [Data transfer between layers]
  - Fields: [list fields]

**Application Services:**
- [ ] `ServiceInterfaceName` - [Interface for infrastructure services]
  - Methods: [list methods]

### Infrastructure Layer Changes

**Repositories:**
- [ ] `RepositoryImplName` - [Implements IRepository interface]
  - Database: [MongoDB/etc]
  - Methods: [CRUD operations]

**External Services:**
- [ ] `ExternalServiceName` - [Third-party integration]
  - API: [service name]
  - Purpose: [what it does]

**Tests:**
- [ ] Unit tests for domain entities/VOs
- [ ] Use case tests with mocked dependencies
- [ ] Integration tests for full flows
- [ ] Repository integration tests

## Design Decisions

### Architecture

[Describe any significant architectural decisions]

### Trade-offs

[List any trade-offs considered and why this approach was chosen]

### Security Considerations

[Any security concerns or measures needed]

### Performance Considerations

[Expected performance characteristics, caching, optimization]

## Dependencies

**Blocks:**
- [List any blockers]

**Blocked By:**
- [List features this depends on]

**Related Features:**
- [Link to related features]

## Testing Strategy

### Unit Tests
- Test entities in isolation
- Test value object validation
- Test domain services

### Integration Tests
- Test use case orchestration
- Test repository implementations
- Test external service integrations

### End-to-End Tests
- Test complete user flows
- Test error scenarios

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Code follows DDD principles and .cursorrules
- [ ] All tests passing (unit + integration)
- [ ] Test coverage > 80%
- [ ] Code reviewed and approved
- [ ] DDD diagrams updated and included in PR
- [ ] Documentation updated
- [ ] No breaking changes to public APIs
- [ ] Deployed to staging and smoke tested

## Notes

[Additional context, questions, or clarifications needed]

---

**Template Version:** 1.0  
**Last Updated:** 2026-01-29
