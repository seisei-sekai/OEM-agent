# DDD Architecture Visualization

**Created:** 2026-01-29-21:50 (Tokyo Time)
**Last Updated:** 2026-01-29-21:50 (Tokyo Time)
**Purpose:** Documentation for DDD architecture visualization and dependency analysis

---

## Overview

This project uses `dependency-cruiser` to visualize and validate Domain-Driven Design (DDD) architecture. The tool helps ensure proper layer separation and detects architectural violations.

## Generated Diagrams

All diagrams are located in `docs/ddd-diagrams/`

### 1. Architecture Overview (`architecture.svg`)
High-level view of DDD layers showing:
- **Domain Layer** (Red) - Core business logic
- **Application Layer** (Green) - Use cases and application services
- **Infrastructure Layer** (Blue) - External integrations

### 2. Detailed Dependencies (`dependencies.svg`)
Detailed module-level dependency graph showing all files and their relationships.
**This is the most useful diagram - shows complete dependency tree with arrows.**

### 3. Interactive Report (`report.html`)
HTML report with:
- Clickable dependency graph
- Violation details
- Module statistics
- Circular dependency detection

## Available Commands

```bash
# Validate DDD layer rules (no violations = clean architecture)
pnpm ddd:validate

# Generate detailed dependency graph (RECOMMENDED - shows all dependencies with arrows)
pnpm ddd:graph
# Output: docs/ddd-diagrams/dependencies.svg

# Generate architecture overview
pnpm ddd:archi
# Output: docs/ddd-diagrams/architecture.svg

# Generate interactive HTML report
pnpm ddd:report
# Output: docs/ddd-diagrams/report.html

# Run all commands at once
pnpm ddd:all
```

## DDD Layer Rules

The configuration enforces strict DDD principles:

### ✅ Allowed Dependencies

```
Infrastructure → Application → Domain
Apps (API/Web) → Application → Domain
Apps (API/Web) → Infrastructure (via DI)
```

### ❌ Prohibited Dependencies (Violations)

```
Domain → Application ❌
Domain → Infrastructure ❌
Application → Infrastructure ❌ (use interfaces instead)
```

## Validation Results

Current status: **✅ No DDD layer violations found!**

This means:
- Domain layer is clean and has no dependencies on outer layers
- Application layer depends only on Domain interfaces
- Infrastructure layer correctly implements Domain interfaces
- Dependency inversion principle is properly applied

## Color Coding

In generated diagrams:

| Color | Layer | Purpose |
|-------|-------|---------|
| 🔴 Red | Domain | Entities, Value Objects, Domain Services |
| 🟢 Green | Application | Use Cases, DTOs, Application Services |
| 🔵 Blue | Infrastructure | Repositories, AI Services, Database |
| 🟡 Yellow | API App | Hono REST API |
| 🟣 Purple | Web App | Next.js Frontend |

## Configuration

DDD rules are defined in `.dependency-cruiser.cjs`:

### Key Rules

1. **no-circular** - Warns about circular dependencies
2. **domain-cannot-depend-on-application** - Error if Domain → Application
3. **domain-cannot-depend-on-infrastructure** - Error if Domain → Infrastructure
4. **application-cannot-depend-on-infrastructure** - Error if Application → Infrastructure

### Excluded Paths

- `node_modules/` - Third-party dependencies
- `.next/` - Next.js build output
- `dist/` - TypeScript build output
- `.turbo/` - Turborepo cache
- `*.test.ts` - Test files
- `*.config.js` - Configuration files

## Continuous Integration

To add DDD validation to CI pipeline, add to your CI script:

```yaml
- name: Validate DDD Architecture
  run: pnpm ddd:validate
```

This will fail the build if DDD principles are violated.

## Troubleshooting

### Issue: "Command not found: depcruise"

**Solution:**
```bash
pnpm install
```

### Issue: "Command not found: dot"

**Solution:**
```bash
# macOS
brew install graphviz

# Ubuntu/Debian
sudo apt-get install graphviz

# Windows (via Chocolatey)
choco install graphviz
```

### Issue: Path resolution errors

**Solution:** Ensure `tsconfig.json` has correct path mappings:
```json
{
  "compilerOptions": {
    "paths": {
      "@repo/domain": ["./packages/domain/src"],
      "@repo/application": ["./packages/application/src"],
      "@repo/infrastructure": ["./packages/infrastructure/src"]
    }
  }
}
```

## Best Practices

1. **Run validation before commits**
   ```bash
   pnpm ddd:validate
   ```

2. **Review architecture regularly**
   - Open `docs/ddd-report.html` in browser
   - Check for growing complexity
   - Identify refactoring opportunities

3. **Update diagrams after major changes**
   ```bash
   pnpm ddd:all
   git add docs/ddd-*.svg docs/ddd-report.html
   git commit -m "docs: update DDD architecture diagrams"
   ```

4. **Use diagrams in documentation**
   - Reference in architectural decision records (ADRs)
   - Include in onboarding materials
   - Share in design reviews

## Further Reading

- [Domain-Driven Design by Eric Evans](https://www.domainlanguage.com/ddd/)
- [Clean Architecture by Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [dependency-cruiser Documentation](https://github.com/sverweij/dependency-cruiser)
- [Project Architecture Guide](./ARCHITECTURE.md)

## Maintenance

Regenerate diagrams:
- After adding new packages
- After restructuring modules
- Before major releases
- During architecture reviews

Command:
```bash
pnpm ddd:all
```

This ensures diagrams stay synchronized with codebase structure.
