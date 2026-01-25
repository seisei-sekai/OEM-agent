# Docker + TypeScript Compilation Pitfalls

**Created:** 2026-01-23 17:38 (Tokyo Time)
**Last Updated:** 2026-01-23 17:38 (Tokyo Time)
**Purpose:** Document critical issues with TypeScript incremental compilation in Docker environments

---

## 🚨 The Problem

### Symptoms

You make code changes (add logs, modify functions, etc.) but after rebuilding Docker:
- Changes don't appear in running container
- Old behavior persists
- Build succeeds without errors
- Local `pnpm build` works fine

### Root Cause

**TypeScript Incremental Compilation** uses `.tsbuildinfo` files to cache compilation state. In multi-stage Docker builds with layer caching, this can cause:

1. **Stale `.tsbuildinfo`** files cached in Docker layers
2. **Partial recompilation** - TypeScript skips files it thinks haven't changed
3. **Old `.js` files** copied to final image while source `.ts` files have new changes

### The Hidden Culprit

Dockerfiles with error suppression:

```dockerfile
# ❌ THIS IS DANGEROUS
RUN pnpm --filter @repo/infrastructure build || echo "Build completed with warnings"
```

This causes:
- Compilation errors to be silently ignored
- Docker build to succeed even when TypeScript fails
- Incomplete or missing `.js` files in the container
- No visibility into what actually failed

---

## ✅ The Solution

### 1. Remove Error Suppression

```dockerfile
# ❌ BAD
RUN pnpm build || echo "Build completed"
RUN npm run build || true

# ✅ GOOD - Fail fast!
RUN pnpm build
RUN npm run build
```

**Why**: You WANT the build to fail if compilation has errors. Silent failures are impossible to debug.

### 2. Force Clean Rebuild When Debugging

```bash
# Stop everything
docker-compose down

# Clean local artifacts
rm -rf packages/*/dist
rm -rf packages/*/*.tsbuildinfo
rm -rf apps/*/dist
rm -rf apps/*/*.tsbuildinfo

# Rebuild without cache
docker-compose build --no-cache

# Start
docker-compose up -d
```

### 3. Verify Deployed Code

After rebuild, check if your changes actually made it to the container:

```bash
# Search for a specific function/log you added
docker exec <container-name> grep "my new log message" /app/path/to/file.js

# Or check file modification time
docker exec <container-name> ls -la /app/packages/infrastructure/dist/agent/

# Or read specific lines
docker exec <container-name> head -50 /app/path/to/file.js
```

### 4. Prevention in Development

Add to your development workflow:

```bash
# Before rebuilding Docker, clean locally
pnpm clean  # If you have a clean script

# Or manually
find . -name "*.tsbuildinfo" -delete
find . -type d -name "dist" -exec rm -rf {} + 2>/dev/null || true
```

---

## 🔍 How to Diagnose

### Step 1: Check if it's a Docker issue

```bash
# Build locally
cd packages/infrastructure
pnpm build

# Check if new code is in local dist/
grep "my new code" dist/agent/MyFile.js

# If YES → Docker problem
# If NO → TypeScript configuration problem
```

### Step 2: Check Docker build logs

```bash
docker-compose build api 2>&1 | tee build.log

# Search for compilation errors
grep -i "error" build.log
grep -i "warning" build.log
grep -i "failed" build.log
```

### Step 3: Compare local vs Docker

```bash
# Local file
cat packages/infrastructure/dist/agent/graph.js | grep "conditional"

# Docker file
docker exec api-container cat /app/packages/infrastructure/dist/agent/graph.js | grep "conditional"

# Compare
diff \
  <(cat packages/infrastructure/dist/agent/graph.js) \
  <(docker exec api-container cat /app/packages/infrastructure/dist/agent/graph.js)
```

---

## 📋 Checklist for Future Debugging

When code changes don't appear in Docker:

- [ ] Remove all `|| echo` and `|| true` from Dockerfile RUN commands
- [ ] Delete local `dist/` and `.tsbuildinfo` files
- [ ] Run `pnpm build` locally and verify output
- [ ] Rebuild Docker with `--no-cache`
- [ ] Verify file in container with `docker exec ... grep ...`
- [ ] Check Docker build logs for actual TypeScript errors
- [ ] Compare local dist/ with container dist/
- [ ] Restart containers after rebuild
- [ ] Check that container is using new image (not cached)

---

## 🎓 Lessons Learned

1. **Never suppress errors in build pipelines** - You need to know when compilation fails
2. **TypeScript .tsbuildinfo is not Docker-friendly** - Incremental compilation assumes stable filesystem
3. **Docker layer caching can work against you** - Especially with build artifacts
4. **Always verify deployed code** - Don't assume `docker build` success means your changes are included
5. **Clean builds are your friend** - When in doubt, `--no-cache` everything

---

## 🔗 Related Issues

- **Issue**: "Generate Mockup button stuck in loop"
  - **Real Cause**: New routing code not compiled into Docker
  - **Symptom**: Logs showed old routing behavior
  - **Solution**: Clean rebuild exposed the real compilation state

- **Issue**: "New debug logs not appearing"
  - **Real Cause**: `AgentService.ts` changes not compiled
  - **Symptom**: Expected `console.log()` statements missing from output
  - **Solution**: Verified with `docker exec ... grep` that old code was in container

---

## 📚 References

- [TypeScript Incremental Compilation](https://www.typescriptlang.org/tsconfig#incremental)
- [Docker Multi-Stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [Best Practices for Docker + Node.js](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)

---

**Remember**: If Docker build succeeds but your code changes aren't working, check the compiled JavaScript in the container first!


