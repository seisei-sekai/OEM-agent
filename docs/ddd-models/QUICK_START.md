# DDD Models Quick Start

**For Stakeholders:** Complete DDD + Scrum documentation auto-generated from code

---

## 🚀 View the Main Summary (Start Here)

```bash
open docs/ddd-models/0-summary/stakeholder-summary.svg
```

This single diagram shows everything:
- ✅ System context and bounded contexts
- ✅ 4 sub-domains (Conversation, Product, Branding, Cost)
- ✅ 3 key aggregates (ChatSession, Product, BrandingInfo)
- ✅ 6 use cases covering complete user journey
- ✅ 5 domain events for event sourcing

---

## 📊 All Available Diagrams

### For Executives & Product Owners

1. **Stakeholder Summary** ⭐ MOST IMPORTANT
   ```bash
   open docs/ddd-models/0-summary/stakeholder-summary.svg
   ```

2. **Product Backlog & Sprint Planning**
   ```bash
   open docs/ddd-models/4-scrum-lifecycle/product-backlog.svg
   ```

3. **Event Storming - User Journey**
   ```bash
   open docs/ddd-models/4-scrum-lifecycle/event-storming.svg
   ```

### For Domain Experts

4. **Bounded Context Map**
   ```bash
   open docs/ddd-models/1-strategic-design/bounded-context-map.svg
   ```

5. **Ubiquitous Language Vocabulary**
   ```bash
   open docs/ddd-models/1-strategic-design/ubiquitous-language.svg
   ```

### For Developers

6. **Domain Model (Complete Class Diagram)**
   ```bash
   open docs/ddd-models/2-tactical-design/domain-model.svg
   ```

7. **Aggregate Design**
   ```bash
   open docs/ddd-models/2-tactical-design/aggregate-design.svg
   ```

8. **Use Case Catalog**
   ```bash
   open docs/ddd-models/3-application-layer/use-case-catalog.svg
   ```

---

## 🔄 Update Documentation

### Automatic Update (Watch Mode)

```bash
pnpm ddd:watch
```

Automatically regenerates when code changes.

### Manual Update

```bash
# Generate Mermaid + SVG
pnpm ddd:docs

# Or step by step
pnpm ddd:generate  # Generate Mermaid files
pnpm ddd:convert   # Convert to SVG
```

---

## 📈 Current Statistics

See [`stats.json`](./stats.json):

- **Domain Layer:** 4 entities, 4 value objects, 5 events, 1 service
- **Application Layer:** 6 use cases, 7 DTOs, 4 interfaces
- **Scrum:** 3 epics, 6 sprints

---

## 📝 What's Included

All DDD concepts + Scrum lifecycle:

| Category | Diagrams | Description |
|----------|----------|-------------|
| **Summary** | 2 diagrams | Executive overview, stakeholder summary |
| **Strategic Design** | 2 diagrams | Bounded context, ubiquitous language |
| **Tactical Design** | 2 diagrams | Aggregates, domain model |
| **Application** | 1 diagram | Use case catalog |
| **Scrum** | 2 diagrams | Product backlog, event storming |

**Total:** 9 diagrams × 2 formats = 18 files

---

## 🎯 For Stakeholder Communication

### Before Meeting

```bash
# Update documentation
pnpm ddd:docs

# Open main summary
open docs/ddd-models/0-summary/stakeholder-summary.svg
```

### During Meeting

Share screen showing:
1. Stakeholder summary (high-level)
2. Product backlog (Scrum status)
3. Event storming (user journey)

### After Meeting

Email stakeholders:
- `stakeholder-summary.svg` - Main overview
- `product-backlog.svg` - Sprint status
- Link to online Mermaid viewer for interactive exploration

---

## 💡 Tips

### View Mermaid Online

```bash
# Copy content
cat docs/ddd-models/0-summary/stakeholder-summary.mmd | pbcopy

# Visit https://mermaid.live/ and paste
```

### Embed in Presentations

All SVG files can be directly inserted into:
- PowerPoint
- Google Slides
- Keynote
- Markdown presentations

### Version Control

- ✅ Commit `.mmd` files (small, text-based)
- ⚠️ Optional: Commit `.svg` files (larger, but visual)

---

## 🔗 Related Documentation

- [README.md](./README.md) - Complete documentation index
- [../DDD_VISUALIZATION.md](../DDD_VISUALIZATION.md) - Code dependency visualization
- [../ARCHITECTURE.md](../ARCHITECTURE.md) - System architecture

---

**Last Generated:** Auto-updated with `pnpm ddd:docs`  
**Source:** Live code analysis + PRD parsing  
**Always up-to-date:** Reflects current implementation
