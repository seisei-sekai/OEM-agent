#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import simpleGit from 'simple-git';
import { GitDiffAnalyzer } from '../analyzers/git-diff-analyzer';

const PROJECT_ROOT = path.join(__dirname, '../..');
const git = simpleGit(PROJECT_ROOT);

interface PRPreparationOptions {
  baseBranch?: string;
  title?: string;
  draft?: boolean;
}

async function preparePR(options: PRPreparationOptions = {}) {
  console.log('🚀 Preparing Pull Request...\n');

  try {
    const { baseBranch = 'main', title, draft = false } = options;

    // Step 1: Verify we're not on main
    const status = await git.status();
    const currentBranch = status.current;

    if (currentBranch === 'main' || currentBranch === 'master') {
      console.error('❌ Cannot create PR from main/master branch');
      console.log('   Create a feature branch first: git checkout -b feature/your-feature');
      process.exit(1);
    }

    console.log(`📍 Current branch: ${currentBranch}`);
    console.log(`📍 Base branch: ${baseBranch}`);

    // Step 2: Run tests
    console.log('\n🧪 Running tests...');
    let testResults: any;
    try {
      const testOutput = execSync('pnpm test --reporter=json', {
        cwd: PROJECT_ROOT,
        encoding: 'utf-8',
        stdio: 'pipe',
      });
      testResults = parseTestResults(testOutput);
      console.log(`   ✅ All tests passed (${testResults.totalTests} tests)`);
    } catch (error: any) {
      console.error('   ❌ Tests failed!');
      console.log('\n   Fix failing tests before creating PR.');
      console.log('   Run: pnpm test');
      process.exit(1);
    }

    // Step 3: Analyze code changes
    console.log('\n🔍 Analyzing code changes...');
    const diffAnalyzer = new GitDiffAnalyzer(PROJECT_ROOT);
    const diffAnalysis = await diffAnalyzer.analyzeDiff(baseBranch, 'HEAD');

    console.log(`   Files changed: ${diffAnalysis.summary.totalFiles}`);
    console.log(`   Lines added: +${diffAnalysis.summary.additions}`);
    console.log(`   Lines deleted: -${diffAnalysis.summary.deletions}`);
    console.log(`   Domain changes: ${diffAnalysis.summary.domainChanges}`);
    console.log(`   Application changes: ${diffAnalysis.summary.applicationChanges}`);

    // Step 4: Find latest DDD diff (already generated in pre-commit hook)
    console.log('\n📊 Locating DDD diff diagrams...');
    const changesDir = path.join(PROJECT_ROOT, 'docs/ddd-changes');
    let latestDiffPath = '';
    
    try {
      if (fs.existsSync(changesDir)) {
        const diffDirs = fs.readdirSync(changesDir)
          .filter(dir => !dir.startsWith('.'))
          .sort()
          .reverse();
        
        if (diffDirs.length > 0) {
          latestDiffPath = path.join(changesDir, diffDirs[0]);
          console.log(`   ✅ Found: ${diffDirs[0]}`);
        } else {
          console.warn('   ⚠️  No DDD diff found (run git commit to generate)');
        }
      }
    } catch (error) {
      console.warn('   ⚠️  Could not locate DDD diff');
    }

    // Step 5: Analyze review focus areas
    console.log('\n🎯 Identifying review focus areas...');
    const focusAreas = identifyReviewFocusAreas(diffAnalysis);

    // Step 6: Create PR body
    console.log('\n📝 Creating PR description...');
    const prBody = generatePRBody({
      currentBranch,
      baseBranch,
      diffAnalysis,
      testResults,
      focusAreas,
      diffPath: latestDiffPath,
    });

    // Save PR body to file
    const prBodyPath = path.join(PROJECT_ROOT, '.github/pr-body.md');
    fs.writeFileSync(prBodyPath, prBody);
    console.log(`   ✅ PR body saved: ${prBodyPath}`);

    // Step 7: Create PR (if gh CLI available)
    console.log('\n🔄 Creating pull request...');
    const prTitle = title || `feat: ${currentBranch.replace('feature/', '')}`;

    try {
      const prUrl = execSync(
        `gh pr create --title "${prTitle}" --body-file .github/pr-body.md ${draft ? '--draft' : ''}`,
        {
          cwd: PROJECT_ROOT,
          encoding: 'utf-8',
        }
      ).trim();

      console.log(`\n✅ Pull request created successfully!`);
      console.log(`🔗 ${prUrl}`);
      
      // Clean up
      fs.unlinkSync(prBodyPath);

    } catch (error: any) {
      if (error.message.includes('gh: command not found')) {
        console.log('\n📋 GitHub CLI not found. PR body saved to:');
        console.log(`   ${prBodyPath}`);
        console.log('\n   Create PR manually at: https://github.com/your-repo/compare');
      } else {
        console.error('\n❌ Error creating PR:', error.message);
        console.log(`\n   PR body saved to: ${prBodyPath}`);
        console.log('   Try creating PR manually');
      }
    }

  } catch (error) {
    console.error('\n❌ Error preparing PR:', error);
    process.exit(1);
  }
}

function parseTestResults(output: string): any {
  // Simplified test result parsing
  try {
    const json = JSON.parse(output);
    return {
      totalTests: json.numTotalTests || 0,
      passedTests: json.numPassedTests || 0,
      failedTests: json.numFailedTests || 0,
      coverage: json.coveragePercent || 0,
    };
  } catch {
    return {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      coverage: 0,
    };
  }
}

function identifyReviewFocusAreas(diffAnalysis: any): string[] {
  const focusAreas: string[] = [];

  // Identify critical changes
  for (const component of diffAnalysis.dddComponents) {
    if (component.layer === 'domain' && component.changeType === 'added') {
      focusAreas.push(
        `**${component.componentName}** (${component.file}) - New domain ${component.componentType}, review business logic`
      );
    } else if (component.layer === 'domain' && component.changeType === 'modified') {
      focusAreas.push(
        `**${component.componentName}** (${component.file}) - Modified domain logic, verify invariants`
      );
    } else if (component.componentType === 'repository' && component.changeType !== 'deleted') {
      focusAreas.push(
        `**${component.componentName}** (${component.file}) - Data access logic, check queries`
      );
    } else if (component.file.includes('external') || component.file.includes('integration')) {
      focusAreas.push(
        `**${component.componentName}** (${component.file}) - External integration, verify error handling`
      );
    }
  }

  return focusAreas;
}

function generatePRBody(data: any): string {
  const { diffAnalysis, testResults, focusAreas, diffPath } = data;
  
  // Extract diff directory name from path
  const diffDirName = diffPath ? path.basename(diffPath) : 'PR-current';
  
  // Read and process comparison.md if available
  let comparisonContent = '';
  if (diffPath) {
    const comparisonPath = path.join(diffPath, 'comparison.md');
    if (fs.existsSync(comparisonPath)) {
      comparisonContent = fs.readFileSync(comparisonPath, 'utf-8');
      
      // Replace relative paths with absolute paths from repo root
      // ./before/xxx.svg -> docs/ddd-changes/[timestamp]/before/xxx.svg
      // ./after/xxx.svg -> docs/ddd-changes/[timestamp]/after/xxx.svg
      const relativePath = `docs/ddd-changes/${diffDirName}`;
      comparisonContent = comparisonContent
        .replace(/\.\/(before|after)\//g, `${relativePath}/$1/`)
        // Remove the title (first line) since we'll add our own
        .replace(/^# DDD Changes.*\n\n/, '')
        // Adjust headings (## -> ###) to fit within PR structure
        .replace(/^## /gm, '### ')
        .replace(/^### /gm, '#### ');
    }
  }

  return `## Changes Summary

**Files Changed:** ${diffAnalysis.summary.totalFiles}  
**Lines Added:** +${diffAnalysis.summary.additions}  
**Lines Deleted:** -${diffAnalysis.summary.deletions}

### DDD Component Changes

**Domain Layer:**
- Entities: ${diffAnalysis.summary.domainChanges} changes
- See detailed breakdown in DDD diff diagrams

**Application Layer:**
- Use Cases: ${diffAnalysis.summary.applicationChanges} changes

**Infrastructure Layer:**
- Implementations: ${diffAnalysis.summary.infrastructureChanges} changes

**Tests:**
- Test files: ${diffAnalysis.summary.testChanges} changes

---

## DDD Architecture Impact

<details>
<summary><b>📊 View Full DDD Comparison (Click to expand)</b></summary>

${comparisonContent || `**View Complete Comparison:** [docs/ddd-changes/${diffDirName}/comparison.md](../docs/ddd-changes/${diffDirName}/comparison.md)

This PR includes side-by-side DDD diagram comparisons showing:
- Domain Model changes
- Use Case catalog updates
- Bounded Context evolution`}

</details>

---

## Testing

✅ **All tests passing**

**Test Summary:**
- Total: ${testResults.totalTests} tests
- Passed: ${testResults.passedTests}
- Failed: ${testResults.failedTests}
- Coverage: ${testResults.coverage}%

**Test Coverage by Layer:**
- Domain Layer: Run \`pnpm test packages/domain\`
- Application Layer: Run \`pnpm test packages/application\`
- Infrastructure Layer: Run \`pnpm test packages/infrastructure\`

---

## Code Review Checklist

### DDD Principles
- [ ] Domain logic is in domain layer
- [ ] Use cases are thin orchestration
- [ ] Tests cover edge cases
- [ ] No breaking changes to public APIs
- [ ] Domain events properly emitted

### Code Quality
- [ ] Follows .cursorrules
- [ ] No linting errors
- [ ] TypeScript strict mode
- [ ] Proper error handling

---

## Reviewer Focus Areas

${focusAreas.length > 0 ? focusAreas.map((area, i) => `${i + 1}. ${area}`).join('\n') : 'No critical focus areas identified'}

---

## Additional Notes

<!-- Add any additional context for reviewers -->

---

**Generated by:** \`pnpm workflow:prepare-pr\`  
**Timestamp:** ${new Date().toISOString()}
`;
}

// Main execution
const args = process.argv.slice(2);
const options: PRPreparationOptions = {};

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--base-branch' && args[i + 1]) {
    options.baseBranch = args[i + 1];
    i++;
  } else if (args[i] === '--title' && args[i + 1]) {
    options.title = args[i + 1];
    i++;
  } else if (args[i] === '--draft') {
    options.draft = true;
  }
}

preparePR(options);
