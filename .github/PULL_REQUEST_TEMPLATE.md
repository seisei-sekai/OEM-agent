# [Feature Name]

**Notion Link:** [Link to Notion requirement]  
**Related Issue:** #[issue-number]

---

## Feature Description

<!-- Brief description of what this PR accomplishes -->

## User Story

**As a** [role]  
**I want** [capability]  
**So that** [benefit]

---

## Changes Summary

<!-- Auto-populated by workflow:prepare-pr script -->

### Domain Layer
- [ ] Entities: 
- [ ] Value Objects: 
- [ ] Domain Events: 
- [ ] Domain Services: 

### Application Layer
- [ ] Use Cases: 
- [ ] DTOs: 
- [ ] Application Services: 

### Infrastructure Layer
- [ ] Repositories: 
- [ ] External Services: 
- [ ] Integrations: 

### Tests
- [ ] Unit Tests: 
- [ ] Integration Tests: 
- [ ] E2E Tests: 

---

## DDD Architecture Impact

<!-- Auto-populated: link to diff diagrams -->

**View DDD Changes:** [docs/ddd-changes/PR-{number}/comparison.md](../docs/ddd-changes/PR-{number}/comparison.md)

### Architecture Diagrams

**Before vs After:**
- Stakeholder Summary
- Domain Model  
- Use Case Catalog

**Changes:**
- ✅ Added: [components]
- 🔄 Modified: [components]
- ❌ Deleted: [components]

---

## Testing

<!-- Auto-populated from test results -->

### Test Results
- [ ] All tests passing ✅
- [ ] Coverage: **[X]%** (threshold: 80%)
- [ ] No regressions detected

### Test Files
- `[test-file-1.test.ts]` - [X tests, Y passing]
- `[test-file-2.test.ts]` - [X tests, Y passing]

### Test Coverage by Layer
- Domain: [X]%
- Application: [X]%
- Infrastructure: [X]%

---

## Code Quality Checklist

<!-- Auto-populated based on analysis -->

### DDD Principles
- [ ] Domain logic is in domain layer (entities/VOs)
- [ ] Use cases are thin orchestration only
- [ ] No business logic in infrastructure layer
- [ ] Proper aggregate boundaries maintained
- [ ] Domain events used for decoupling

### Code Standards
- [ ] Follows .cursorrules guidelines
- [ ] TypeScript strict mode compliant
- [ ] No `any` types used
- [ ] Proper error handling
- [ ] Logging added for important operations

### Testing
- [ ] Tests follow TDD (written before implementation)
- [ ] Edge cases covered
- [ ] Error paths tested
- [ ] Integration tests for external dependencies
- [ ] No flaky tests

### Documentation
- [ ] Code comments for complex logic
- [ ] JSDoc for public APIs
- [ ] README updated (if needed)
- [ ] DDD diagrams reflect changes

---

## Reviewer Focus Areas

<!-- AI-generated based on code changes -->

### Critical Review Points

1. **[Component Name]** - [File path]
   - **Why critical:** [Explanation]
   - **Review for:** [Specific aspects]

2. **[Component Name]** - [File path]
   - **Why critical:** [Explanation]
   - **Review for:** [Specific aspects]

### Security Review

- [ ] No sensitive data in logs
- [ ] Input validation implemented
- [ ] Authorization checks in place
- [ ] No SQL injection vectors

### Performance Review

- [ ] No N+1 query problems
- [ ] Appropriate caching used
- [ ] Database indexes considered
- [ ] No blocking operations in hot paths

---

## Breaking Changes

- [ ] No breaking changes
- [ ] **OR** Breaking changes documented below:

**Breaking Change:** [Description]
- **Migration Path:** [How to migrate]
- **Affected Components:** [List]

---

## Deployment Notes

### Prerequisites
- [ ] Database migrations (if any)
- [ ] Environment variables (if any)
- [ ] External service configuration (if any)

### Rollback Plan
[Describe how to rollback if issues arise]

---

## Screenshots / Demos

<!-- If applicable, add screenshots or screen recordings -->

---

## Checklist Before Requesting Review

- [ ] Self-reviewed the code
- [ ] Ran all tests locally (`pnpm test`)
- [ ] Ran DDD validation (`pnpm ddd:validate`)
- [ ] Generated DDD diff diagrams (`pnpm workflow:prepare-pr`)
- [ ] Updated documentation
- [ ] No console.log or debug code left
- [ ] Commit messages follow convention
- [ ] Branch is up to date with base branch

---

## Additional Context

<!-- Any additional information that reviewers should know -->

---

**PR Template Version:** 1.0  
**Auto-populated by:** `pnpm workflow:prepare-pr`
