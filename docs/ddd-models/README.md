# DDD Models & Stakeholder Documentation

**Created:** 2026-01-29-22:15 (Tokyo Time)  
**Last Updated:** 2026-01-29-22:15 (Tokyo Time)  
**Purpose:** Auto-generated DDD documentation for stakeholder communication

---

## Overview

This directory contains **auto-generated** DDD (Domain-Driven Design) documentation combined with Scrum lifecycle management. All diagrams are generated from actual code and PRD documents.

**Generation Command:**
```bash
pnpm ddd:docs
```

---

## Documentation Structure

### 0. Summary (Executive Overview)

**Target Audience:** Executives, Product Owners, Non-technical Stakeholders

- [`overview.mmd`](./0-summary/overview.mmd) / [`overview.svg`](./0-summary/overview.svg)
  - System-wide architecture overview
  - Layer distribution and counts
  - High-level component relationships

- **[`stakeholder-summary.mmd`](./0-summary/stakeholder-summary.mmd) / [`stakeholder-summary.svg`](./0-summary/stakeholder-summary.svg)** ⭐ START HERE
  - **Primary document for stakeholder communication**
  - Bounded context overview
  - Sub-domain breakdown
  - Key aggregates summary
  - Use cases and domain events

### 1. Strategic Design (DDD Strategy)

**Target Audience:** Product Owners, Domain Experts, Architects

- [`bounded-context-map.mmd`](./1-strategic-design/bounded-context-map.mmd) / [`bounded-context-map.svg`](./1-strategic-design/bounded-context-map.svg)
  - Single bounded context: "OEM Agent Context"
  - 4 sub-domains: Conversation, Product, Branding, Cost
  - External system integrations: OpenAI, Weaviate, MongoDB

- [`ubiquitous-language.mmd`](./1-strategic-design/ubiquitous-language.mmd) / [`ubiquitous-language.svg`](./1-strategic-design/ubiquitous-language.svg)
  - Complete vocabulary
  - Entities, Value Objects, Domain Events
  - Repository interfaces
  - Domain services

### 2. Tactical Design (DDD Tactics)

**Target Audience:** Developers, Technical Architects

- [`aggregate-design.mmd`](./2-tactical-design/aggregate-design.mmd) / [`aggregate-design.svg`](./2-tactical-design/aggregate-design.svg)
  - Aggregate roots and boundaries
  - Entity relationships within aggregates
  - Consistency boundaries

- [`domain-model.mmd`](./2-tactical-design/domain-model.mmd) / [`domain-model.svg`](./2-tactical-design/domain-model.svg)
  - Complete class diagram
  - All entities and value objects
  - Property and method details
  - Relationships and cardinality

### 3. Application Layer

**Target Audience:** Developers, QA Engineers

- [`use-case-catalog.mmd`](./3-application-layer/use-case-catalog.mmd) / [`use-case-catalog.svg`](./3-application-layer/use-case-catalog.svg)
  - All use cases organized by category
  - Use case responsibilities
  - Mind map visualization

### 4. Scrum Lifecycle

**Target Audience:** Product Owners, Scrum Masters, Stakeholders

- [`product-backlog.mmd`](./4-scrum-lifecycle/product-backlog.mmd) / [`product-backlog.svg`](./4-scrum-lifecycle/product-backlog.svg)
  - Gantt chart of all epics and features
  - Sprint timelines
  - Status tracking (done/active/planned)

- [`event-storming.mmd`](./4-scrum-lifecycle/event-storming.mmd) / [`event-storming.svg`](./4-scrum-lifecycle/event-storming.svg)
  - Complete user journey timeline
  - Domain events in chronological order
  - Flow from user entry to completion

---

## Quick Start for Stakeholders

### View the Main Summary

```bash
open docs/ddd-models/0-summary/stakeholder-summary.svg
```

This single diagram shows:
- ✅ System context and bounded contexts
- ✅ Sub-domain organization
- ✅ Key business aggregates
- ✅ Use cases coverage
- ✅ Domain events

### View in Browser (Mermaid)

1. Copy Mermaid content:
   ```bash
   cat docs/ddd-models/0-summary/stakeholder-summary.mmd | pbcopy
   ```

2. Visit [Mermaid Live Editor](https://mermaid.live/)

3. Paste and view interactive diagram

### View in GitHub

All `.mmd` files can be embedded in Markdown and will render automatically on GitHub.

---

## File Formats

Each diagram is provided in two formats:

| Format | Extension | Purpose | Git Friendly |
|--------|-----------|---------|--------------|
| **Mermaid** | `.mmd` | Source format, editable, version control | ✅ Yes |
| **SVG** | `.svg` | Visual format, high quality, printable | ⚠️ Large files |

**Recommendation:** 
- Commit `.mmd` files to Git
- Regenerate `.svg` files as needed
- Add `*.svg` to `.gitignore` if files are too large

---

## Regeneration

Documentation is **auto-generated** from code. To update:

```bash
# Full regeneration (Mermaid + SVG)
pnpm ddd:docs

# Only generate Mermaid files
pnpm ddd:generate

# Only convert to SVG
pnpm ddd:convert

# Watch mode (auto-regenerate on code changes)
pnpm ddd:watch
```

**Trigger:** Regenerate after:
- Adding new entities or value objects
- Creating new use cases
- Modifying domain events
- Updating PRD documents
- Sprint planning sessions

---

## DDD Concepts Covered

### Strategic Design
- ✅ Bounded Context
- ✅ Ubiquitous Language
- ✅ Context Mapping
- ✅ Sub-domain Classification

### Tactical Design
- ✅ Entities
- ✅ Value Objects
- ✅ Aggregates
- ✅ Domain Events
- ✅ Domain Services
- ✅ Repositories

### Application Design
- ✅ Use Cases
- ✅ Application Services
- ✅ DTOs (Data Transfer Objects)

### Scrum Integration
- ✅ Product Backlog
- ✅ Sprint Planning
- ✅ Epic Organization
- ✅ User Stories
- ✅ Event Storming

---

## Statistics

Current domain model statistics are maintained in [`stats.json`](./stats.json):

```json
{
  "domain": {
    "entities": 4,
    "valueObjects": 5,
    "events": 4,
    "services": 1,
    "repositories": 3
  },
  "application": {
    "useCases": 6,
    "dtos": "~12",
    "interfaces": 4
  },
  "scrum": {
    "epics": 3,
    "sprints": 6
  }
}
```

---

## Maintenance

### Automatic Updates

Run in watch mode during development:
```bash
pnpm ddd:watch
```

This will automatically regenerate documentation when:
- Domain code changes (`packages/domain/**`)
- Application code changes (`packages/application/**`)
- PRD documents change (`Business/**`)

### Manual Updates

For one-time updates:
```bash
pnpm ddd:docs
```

### CI/CD Integration

Documentation can be auto-updated in CI pipeline. See `.github/workflows/ddd-docs.yml` (if configured).

---

## For Different Audiences

### For Executives
Start with: [`stakeholder-summary.svg`](./0-summary/stakeholder-summary.svg)

### For Product Owners
Review: 
- [`product-backlog.svg`](./4-scrum-lifecycle/product-backlog.svg)
- [`event-storming.svg`](./4-scrum-lifecycle/event-storming.svg)

### For Domain Experts
Review:
- [`ubiquitous-language.svg`](./1-strategic-design/ubiquitous-language.svg)
- [`bounded-context-map.svg`](./1-strategic-design/bounded-context-map.svg)

### For Developers
Review:
- [`domain-model.svg`](./2-tactical-design/domain-model.svg)
- [`aggregate-design.svg`](./2-tactical-design/aggregate-design.svg)
- [`use-case-catalog.svg`](./3-application-layer/use-case-catalog.svg)

---

## Related Documentation

- [DDD_VISUALIZATION.md](../DDD_VISUALIZATION.md) - dependency-cruiser visualization
- [DDD_MERMAID_GUIDE.md](../DDD_MERMAID_GUIDE.md) - Mermaid diagram guide
- [ARCHITECTURE.md](../ARCHITECTURE.md) - System architecture
- [PROJECT_GUIDE_CN.md](../PROJECT_GUIDE_CN.md) - Project overview

---

## Support

For issues or questions:
1. Check if diagrams are up-to-date: `pnpm ddd:docs`
2. Verify code changes are reflected in output
3. Review `stats.json` for model counts
4. Check PRD documents for Scrum data accuracy

---

**Auto-generated on:** Every `pnpm ddd:docs` execution  
**Source:** TypeScript code analysis + PRD parsing  
**Tools:** ts-morph, @mermaid-js/mermaid-cli, dependency-cruiser
