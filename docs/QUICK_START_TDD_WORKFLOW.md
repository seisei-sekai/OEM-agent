# TDD Workflow Quick Start

**Quick reference for the complete Scrum-based TDD workflow**

---

## 🚀 One Command to Rule Them All

```bash
pnpm workflow:new-feature my-feature
```

This starts an interactive workflow that guides you through:
1. Creating feature structure
2. Filling requirements
3. Generating design
4. Generating tests
5. Generating code stubs
6. Implementation
7. PR creation

---

## 📋 Quick Reference

### Start New Feature

```bash
pnpm workflow:new-feature feature-name
```

**Creates:**
- `Business/Features/feature-name/requirement.md`
- Feature branch `feature/feature-name`

**Action:** Fill requirement.md (copy from Notion)

---

### Generate Design

```bash
pnpm workflow:generate-design feature-name
```

**Creates:**
- `Business/Features/feature-name/design.md`
- `Business/Features/feature-name/class-diagram.md`

**Includes:**
- Entity/VO/Use case designs
- Sequence diagrams
- Class diagrams

---

### Generate Tests (TDD Red)

```bash
pnpm workflow:generate-tests feature-name
```

**Creates:**
- `packages/domain/src/entities/__tests__/[Entity].test.ts`
- `packages/domain/src/value-objects/__tests__/[VO].test.ts`
- `packages/application/src/use-cases/__tests__/[UseCase].test.ts`
- `Business/Features/feature-name/test-plan.md`

**Action:** Run `pnpm test` - should fail

---

### Generate Code Stubs

```bash
pnpm workflow:generate-stubs feature-name
```

**Creates:**
- `packages/domain/src/entities/[Entity].ts`
- `packages/domain/src/value-objects/[VO].ts`
- `packages/application/src/use-cases/[UseCase].ts`

**Action:** Implement TODOs to make tests pass

---

### Implement (TDD Green)

```bash
pnpm test:watch
```

**Action:**
- Implement code
- Make tests pass
- Refactor

---

### Commit (Auto-Snapshot)

```bash
git add .
git commit -m "feat: implement my-feature"
```

**Automatic (pre-commit hook):**
- Generates DDD snapshot
- Saves to `docs/ddd-snapshots/{date}-{sha}/`
- Includes 18 files (9 .mmd + 9 .svg)
- Auto-stages snapshot

---

### Create PR (Auto-Diff)

```bash
pnpm workflow:prepare-pr
```

**Automatic:**
- Runs tests
- Analyzes changes
- Generates DDD diff diagrams
- Populates PR template
- Creates PR on GitHub

**Creates:**
- `docs/ddd-changes/PR-{number}/comparison.md`
- Before/after diagrams
- Change summary

---

## 🎯 Example Flow (5 minutes)

```bash
# 1. Start
pnpm workflow:new-feature add-favorites

# 2. Fill requirement
# Edit: Business/Features/add-favorites/requirement.md
# Add:
#   - User story
#   - Entities: [Favorite]
#   - Use cases: [AddToFavoritesUseCase]

# 3. Generate all
pnpm workflow:generate-design add-favorites
pnpm workflow:generate-tests add-favorites
pnpm workflow:generate-stubs add-favorites

# 4. Implement
# Edit: packages/domain/src/entities/Favorite.ts
# Make tests pass

# 5. Commit & PR
git commit -am "feat: add favorites feature"
pnpm workflow:prepare-pr
```

**Done!** PR created with full documentation.

---

## 📊 What Gets Generated

### Per Feature

**Business/Features/feature-name/**
- `requirement.md` - Scrum requirement
- `design.md` - Code design (100-500 lines)
- `test-plan.md` - Test checklist
- `class-diagram.md` - Class diagrams

### Per Commit

**docs/ddd-snapshots/2026-01-29-abc123f/**
- 9 Mermaid files (.mmd)
- 9 SVG files (.svg)
- `metadata.json`
- `stats.json`

**Size:** ~250 KB

### Per PR

**docs/ddd-changes/PR-123/**
- `comparison.md` - Side-by-side view
- `diff-summary.json` - Change data
- `before/` - 9 SVG diagrams
- `after/` - 9 SVG diagrams

**Size:** ~500 KB

---

## 🔄 Automatic Processes

### On Commit

✅ DDD snapshot generated  
✅ Diagrams created  
✅ Metadata saved  
✅ Files auto-staged  
✅ Lint-staged runs  

### On PR

✅ Tests executed  
✅ Changes analyzed  
✅ DDD diff generated  
✅ PR template populated  
✅ Focus areas identified  

### On CI

✅ Tests run  
✅ Coverage checked  
✅ DDD validated  
✅ PR commented  
✅ Artifacts uploaded  

---

## 📖 Documentation

**Complete Guide:** `docs/WORKFLOW_GUIDE.md`  
**Implementation:** `docs/TDD_WORKFLOW_IMPLEMENTATION.md`  
**Cursor Rules:** `.cursorrules` (updated)

---

## 🎯 Commands Cheat Sheet

```bash
# Workflow
pnpm workflow:new-feature [name]
pnpm workflow:generate-design [name]
pnpm workflow:generate-tests [name]
pnpm workflow:generate-stubs [name]
pnpm workflow:prepare-pr

# DDD
pnpm ddd:snapshot
pnpm ddd:diff
pnpm ddd:docs
pnpm ddd:validate

# Testing
pnpm test
pnpm test:watch
pnpm test --coverage
```

---

## ✅ Ready to Use

System is fully operational. Start with:

```bash
pnpm workflow:new-feature test-workflow
```

Then follow the prompts!
