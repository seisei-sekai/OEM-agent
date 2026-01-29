# Feature: Message Timestamps Display

**Created:** 2026-01-29  
**Sprint:** Sprint 3  
**Priority:** Medium  
**Notion Link:** https://notion.so/message-timestamps-example

---

## User Story

**As a** user of the OEM Agent chat interface  
**I want** to see when each message was sent  
**So that** I can track conversation timeline and reference messages by time

## Acceptance Criteria

- [ ] **AC1:** Each message displays a timestamp showing when it was sent
- [ ] **AC2:** Timestamp format is human-readable (e.g., "2:30 PM" or "Yesterday at 3:45 PM")
- [ ] **AC3:** Timestamp is displayed consistently for both user and AI messages
- [ ] **AC4:** Timestamp is shown in the user's local timezone
- [ ] **AC5:** Hovering over timestamp shows full date and time

## Technical Requirements

### Domain Layer Changes

**Entities:**
- [ ] `Message` - Add timestamp formatting method
  - Properties: `timestamp` (already exists as Date)
  - Methods: 
    - `getFormattedTimestamp()` - Returns human-readable time
    - `getRelativeTime()` - Returns relative time (e.g., "5 minutes ago")

**Value Objects:**
- [ ] `Timestamp` - Value object for time representation
  - Properties: `value` (Date), `timezone` (string)
  - Methods: `format()`, `toRelative()`, `toISO()`

**Domain Events:**
- No new domain events required (Message already emits MessageSent event)

**Domain Services:**
- No new domain services required

### Application Layer Changes

**Use Cases:**
- [ ] `LoadChatHistoryUseCase` - Update to include formatted timestamps
  - Input: `{ sessionId: string }`
  - Output: `MessageDTO[]` (with `formattedTimestamp` field)
  - Dependencies: Existing MessageRepository

**DTOs:**
- [ ] `MessageDTO` - Add timestamp fields
  - Fields: 
    - `timestamp` (ISO string)
    - `formattedTimestamp` (human-readable)
    - `relativeTimestamp` (e.g., "5 min ago")

**Application Services:**
- No new application services required

### Infrastructure Layer Changes

**Repositories:**
- No repository changes required (timestamp already stored in DB)

**External Services:**
- No external services required

**Frontend Changes:**
- [ ] Update `MessageBubble` component to display timestamp
- [ ] Add timestamp formatting utility (date-fns or similar)
- [ ] Update message styles to accommodate timestamp
- [ ] Add tooltip for full timestamp on hover

**Tests:**
- [ ] Unit tests for `Timestamp` value object
- [ ] Unit tests for `Message.getFormattedTimestamp()`
- [ ] Use case tests for updated `LoadChatHistoryUseCase`
- [ ] Frontend component tests for timestamp display

## Design Decisions

### Architecture

- Use Value Object pattern for `Timestamp` to encapsulate formatting logic
- Keep timestamp formatting in domain layer (business logic)
- Pass formatted timestamps via DTO to avoid frontend date calculations
- Use existing Message entity timestamp field (no schema changes)

### Trade-offs

**Chosen:** Format timestamps in backend (domain layer)
- ✅ Pro: Consistent formatting across all clients
- ✅ Pro: Business logic stays in domain layer (DDD principle)
- ❌ Con: Slight increase in payload size

**Alternative:** Format in frontend
- ✅ Pro: Smaller API payload
- ❌ Con: Violates DDD (business logic in presentation)
- ❌ Con: Inconsistent formatting across clients

### Security Considerations

- No security concerns (timestamp is not sensitive data)
- Already filtered through existing authentication/authorization

### Performance Considerations

- Minimal impact: O(n) formatting during message retrieval
- Timestamps cached with message DTOs
- No additional database queries required
- Frontend tooltip rendering is lightweight

## Dependencies

**Blocks:**
- None

**Blocked By:**
- None (Message entity already has timestamp field)

**Related Features:**
- Chat history loading
- Message display UI

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

This is a small UI enhancement that improves user experience without requiring:
- Database schema changes (timestamp field already exists)
- New API endpoints (existing endpoints return timestamps)
- Complex business logic (just formatting)

Frontend libraries to consider:
- `date-fns` for date formatting (lightweight, tree-shakeable)
- `dayjs` as alternative (similar API to moment.js)

Example timestamp formats:
- Same day: "2:30 PM"
- Yesterday: "Yesterday at 3:45 PM"
- This week: "Monday at 10:15 AM"
- Older: "Jan 25 at 4:20 PM"

Tooltip format: "January 29, 2026 at 2:30:45 PM PST"

---

**Template Version:** 1.0  
**Last Updated:** 2026-01-29
