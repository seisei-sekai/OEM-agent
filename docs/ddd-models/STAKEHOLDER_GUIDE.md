# Stakeholder Communication Guide

**Target Audience:** Product Owners, Domain Experts, Business Stakeholders  
**Purpose:** Guide for using auto-generated DDD diagrams in stakeholder meetings

---

## Main Document

### Stakeholder Summary ⭐

**File:** [`0-summary/stakeholder-summary.svg`](./0-summary/stakeholder-summary.svg)

**View Command:**
```bash
open docs/ddd-models/0-summary/stakeholder-summary.svg
```

**Contents:**

1. **System Context**
   - OEM Agent Context - Single bounded context
   - Clear system boundaries

2. **Sub-domains**
   - Conversation Management - 2 entities
   - Product Catalog - 1 entity
   - Branding Extraction - 1 entity
   - Cost Calculation - 1 service

3. **Key Aggregates**
   - ChatSession - Chat session aggregate root
   - Product - Product aggregate root
   - BrandingInfo - Branding info aggregate root

4. **Core Use Cases**
   - 6 use cases covering complete user journey

5. **Domain Events**
   - 5 key events supporting event sourcing

---

## Meeting Preparation

### Before Meeting

```bash
# 1. Update all docs (ensure latest)
pnpm ddd:docs

# 2. Open main document
open docs/ddd-models/0-summary/stakeholder-summary.svg

# 3. Prepare supplementary charts
open docs/ddd-models/4-scrum-lifecycle/product-backlog.svg
open docs/ddd-models/4-scrum-lifecycle/event-storming.svg
```

### During Meeting

**Suggested Discussion Order:**

1. **System Overview (5 minutes)**
   - Show `stakeholder-summary.svg`
   - Explain single bounded context
   - Describe 4 sub-domains

2. **Business Process (10 minutes)**
   - Show `event-storming.svg`
   - Demonstrate user journey
   - Discuss key domain events

3. **Development Progress (10 minutes)**
   - Show `product-backlog.svg`
   - Review completed sprints
   - Discuss next sprint plans

4. **Domain Discussion (15 minutes)**
   - Show `ubiquitous-language.svg`
   - Confirm ubiquitous language
   - Discuss domain model

### After Meeting

```bash
# Send to Stakeholders
# - stakeholder-summary.svg
# - product-backlog.svg
# - event-storming.svg
```

---

## By Role

### Product Owner

**Main Focus:**
1. Product Backlog (Sprint progress)
2. Event Storming (User journey)
3. Use Case Catalog (Feature coverage)

**Commands:**
```bash
open docs/ddd-models/4-scrum-lifecycle/product-backlog.svg
open docs/ddd-models/4-scrum-lifecycle/event-storming.svg
open docs/ddd-models/3-application-layer/use-case-catalog.svg
```

### Domain Expert

**Main Focus:**
1. Ubiquitous Language
2. Bounded Context Map
3. Domain Model

**Commands:**
```bash
open docs/ddd-models/1-strategic-design/ubiquitous-language.svg
open docs/ddd-models/1-strategic-design/bounded-context-map.svg
open docs/ddd-models/2-tactical-design/domain-model.svg
```

### Executive / C-Level

**Main Focus:**
1. Stakeholder Summary (System overview)
2. Overview (Architecture overview)

**Commands:**
```bash
open docs/ddd-models/0-summary/stakeholder-summary.svg
open docs/ddd-models/0-summary/overview.svg
```

### Scrum Master

**Main Focus:**
1. Product Backlog (Gantt chart)
2. Event Storming (Flow diagram)

**Commands:**
```bash
open docs/ddd-models/4-scrum-lifecycle/product-backlog.svg
open docs/ddd-models/4-scrum-lifecycle/event-storming.svg
```

---

## Discussion Topics

### Strategic Design Discussion

**Use Document:** `bounded-context-map.svg`

**Discussion Points:**
- Are bounded context boundaries clear?
- Is sub-domain classification reasonable?
- Is external system integration complete?
- Do we need to split into multiple contexts?

### Tactical Design Discussion

**Use Document:** `domain-model.svg`, `aggregate-design.svg`

**Discussion Points:**
- Is entity/value object classification correct?
- Are aggregate boundaries reasonable?
- Are invariants protected?
- Are there any missing domain concepts?

### Scrum Planning Discussion

**Use Document:** `product-backlog.svg`

**Discussion Points:**
- Are epic priorities correct?
- Is sprint timing reasonable?
- Are there any blocking factors?
- Is resource allocation sufficient?

### User Experience Discussion

**Use Document:** `event-storming.svg`

**Discussion Points:**
- Is user journey smooth?
- Are key events captured?
- Are there improvement opportunities?
- Where are the pain points?

---

## Update Frequency

### Daily

During development use watch mode:
```bash
pnpm ddd:watch
```

### Weekly

Before Sprint Review:
```bash
pnpm ddd:docs
```

### Monthly

Before Stakeholder meetings:
```bash
pnpm ddd:docs
# Check stats.json change trends
```

---

## Online Sharing

### GitHub Method

Embed in GitHub README or Wiki:

```markdown
## Architecture Overview

![Stakeholder Summary](./docs/ddd-models/0-summary/stakeholder-summary.svg)
```

### Mermaid Live Method

```bash
# Copy Mermaid content
cat docs/ddd-models/0-summary/stakeholder-summary.mmd | pbcopy

# Visit https://mermaid.live/
# Paste content
# Share generated link
```

### Presentation Method

Directly drag SVG files into:
- PowerPoint
- Google Slides
- Keynote

SVG maintains high quality and can be scaled freely.

---

## FAQ

### Q: Will docs auto-update?

A: Two ways:
- **During development:** Run `pnpm ddd:watch` for auto-update
- **CI/CD:** Auto-updates after pushing to main branch

### Q: How to ensure docs are latest?

A: Before important meetings run:
```bash
pnpm ddd:docs
```

### Q: Can I manually edit charts?

A: You can edit `.mmd` files, but next `pnpm ddd:docs` will overwrite.
Suggestion: Put manually edited charts in other folders.

### Q: What if SVG files are too large?

A: Can commit only `.mmd` files to Git, regenerate SVG when needed:
```bash
echo "docs/ddd-models/**/*.svg" >> .gitignore
```

### Q: How to share with non-technical stakeholders?

A: Use SVG files, which can:
- Open directly in browser
- Embed in PDF
- Insert in presentations
- Print as paper copies

---

## Best Practices

### 1. Regular Sync

Update before each Sprint Review:
```bash
pnpm ddd:docs
```

### 2. Version Tagging

Create snapshots at important milestones:
```bash
cp -r docs/ddd-models docs/ddd-models-v1.0
```

### 3. Compare Changes

Use Git to compare `.mmd` file changes:
```bash
git diff HEAD~1 docs/ddd-models/**/*.mmd
```

### 4. Combine with Other Docs

Use with existing documentation:
- DDD Models (this system) - Domain model visualization
- dependency-cruiser - Code dependency analysis
- Architecture.md - Architecture documentation
- PRD - Product requirements

---

## Support

For issues or questions:
1. Check [README.md](./README.md)
2. Run `pnpm ddd:docs` to regenerate
3. Check `stats.json` statistics

---

**Remember:** All charts are auto-generated from actual code and always reflect the true implementation!

**Next Step:** 
```bash
open docs/ddd-models/0-summary/stakeholder-summary.svg
```
