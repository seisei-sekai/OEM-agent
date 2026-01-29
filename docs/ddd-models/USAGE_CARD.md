# DDD Models - Quick Usage Card

## 🎯 Main Document for Stakeholders

```bash
open docs/ddd-models/0-summary/stakeholder-summary.svg
```

**Contains:**
- ✅ System context (1 bounded context)
- ✅ 4 sub-domains (conversation, product, branding, cost)
- ✅ 3 aggregate roots (ChatSession, Product, BrandingInfo)
- ✅ 6 use cases (complete user journey)
- ✅ 5 domain events (event sourcing)

---

## 📋 Complete Document List

| Category | File | Purpose | Audience |
|---------|------|---------|----------|
| **Summary** | `stakeholder-summary.svg` | Main table ⭐ | Everyone |
| | `overview.svg` | System architecture | Technical |
| **Strategy** | `bounded-context-map.svg` | Context mapping | Architects |
| | `ubiquitous-language.svg` | Unified language | Domain experts |
| **Tactics** | `aggregate-design.svg` | Aggregate design | Developers |
| | `domain-model.svg` | Complete class diagram | Developers |
| **Application** | `use-case-catalog.svg` | Use case catalog | PO/Dev |
| **Scrum** | `product-backlog.svg` | Backlog | PO/SM |
| | `event-storming.svg` | User journey | Everyone |

---

## 🔄 Update Documentation

```bash
# One-time update
pnpm ddd:docs

# Auto-monitor (recommended for development)
pnpm ddd:watch
```

**Update Timing:**
- ✓ After code changes
- ✓ Before Sprint Review
- ✓ Before stakeholder meetings
- ✓ After PRD updates

---

## 📖 Complete Guides

- [README.md](./README.md) - Complete documentation index
- [QUICK_START.md](./QUICK_START.md) - Quick start
- [STAKEHOLDER_GUIDE.md](./STAKEHOLDER_GUIDE.md) - Stakeholder guide

---

**Command Reference:**
```bash
pnpm ddd:docs      # Generate all docs
pnpm ddd:watch     # Auto-update mode
pnpm ddd:validate  # Validate DDD rules
```
