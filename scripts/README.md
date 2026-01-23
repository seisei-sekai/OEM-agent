# Scripts Directory

**Created:** 2026-01-23
**Last Updated:** 2026-01-23
**Purpose:** Utility scripts for OEM Agent project

---

## Available Scripts

### validate-ports.sh

**Purpose:** Validates port configurations across all project files

**Usage:**
```bash
./scripts/validate-ports.sh
```

**What it checks:**
- docker-compose.yml port mappings (5 checks)
- Dockerfile EXPOSE and ENV directives (4 checks)
- env.template configuration (4 checks)
- Terraform firewall rules (2 checks)
- Terraform startup scripts (2 checks)
- Application code port defaults (1 check)
- Demo scripts (3 checks)

**Exit codes:**
- `0` - All checks passed
- `1` - One or more errors found

**Example output:**
```bash
🔍 Validating Port Configuration...

📋 Checking docker-compose.yml...
✅ Web port mapping (3000:3000)
✅ API port mapping (4000:4000)
...

=========================================
Validation Summary
=========================================
✅ All port configurations are correct!
```

**When to run:**
- Before committing code changes
- Before deploying to production
- After updating Terraform configurations
- After modifying docker-compose.yml
- In CI/CD pipeline (recommended)

**CI/CD Integration:**
```yaml
# .github/workflows/validate.yml
- name: Validate Port Configuration
  run: |
    chmod +x ./scripts/validate-ports.sh
    ./scripts/validate-ports.sh
```

---

## Adding New Scripts

When adding new scripts:

1. Make them executable: `chmod +x scripts/your-script.sh`
2. Add shebang: `#!/bin/bash`
3. Add error handling: `set -e`
4. Document in this README
5. Follow the existing structure:
   ```bash
   #!/bin/bash
   set -e
   
   # Script description
   # Usage instructions
   
   # Color codes for output
   GREEN='\033[0;32m'
   RED='\033[0;31m'
   YELLOW='\033[1;33m'
   NC='\033[0m'
   
   # Script logic
   ```

---

## Script Conventions

1. **Use color-coded output:**
   - Green (✅) for success
   - Red (❌) for errors
   - Yellow (⚠️) for warnings

2. **Exit codes:**
   - `0` for success
   - `1` for errors
   - Document expected exit codes

3. **Error handling:**
   - Use `set -e` to exit on errors
   - Provide clear error messages
   - Show how to fix issues

4. **Documentation:**
   - Comment complex logic
   - Provide usage examples
   - Document dependencies

---

## Future Scripts (Planned)

- `deploy.sh` - Automated deployment script
- `backup-db.sh` - Database backup utility
- `health-check.sh` - Full system health check
- `seed-data.sh` - Database seeding script
- `clean-docker.sh` - Clean up Docker resources

---

## References

- [Bash Best Practices](https://google.github.io/styleguide/shellguide.html)
- [Shellcheck](https://www.shellcheck.net/) - Shell script linter


