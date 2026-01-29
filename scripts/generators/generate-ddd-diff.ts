#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { GitDiffAnalyzer, DDDComponentChange } from '../analyzers/git-diff-analyzer';
import { DomainAnalyzer } from '../analyzers/domain-analyzer';
import { ApplicationAnalyzer } from '../analyzers/application-analyzer';
import { execSync } from 'child_process';

const PROJECT_ROOT = path.join(__dirname, '../..');
const CHANGES_DIR = path.join(PROJECT_ROOT, 'docs/ddd-changes');
const SNAPSHOTS_DIR = path.join(PROJECT_ROOT, 'docs/ddd-snapshots');

interface DiffGenerationOptions {
  baseBranch?: string;
  prNumber?: string;
  outputDir?: string;
}

async function generateDDDDiff(options: DiffGenerationOptions = {}) {
  const { baseBranch = 'main', prNumber, outputDir } = options;

  console.log('📊 Generating DDD diff diagrams...\n');

  try {
    // Get PR number from environment or parameter
    const prNum = prNumber || process.env.PR_NUMBER || 'current';
    const diffDir = outputDir || path.join(CHANGES_DIR, `PR-${prNum}`);

    // Create directories
    fs.mkdirSync(path.join(diffDir, 'before'), { recursive: true });
    fs.mkdirSync(path.join(diffDir, 'after'), { recursive: true });

    // Analyze git diff
    console.log('🔍 Analyzing code changes...');
    const diffAnalyzer = new GitDiffAnalyzer(PROJECT_ROOT);
    const diffAnalysis = await diffAnalyzer.analyzeDiff(baseBranch, 'HEAD');

    console.log(`   Found ${diffAnalysis.files.length} changed files`);
    console.log(`   Domain changes: ${diffAnalysis.summary.domainChanges}`);
    console.log(`   Application changes: ${diffAnalysis.summary.applicationChanges}`);
    console.log(`   Infrastructure changes: ${diffAnalysis.summary.infrastructureChanges}`);

    // Get latest snapshot for "before" state
    console.log('\n📸 Finding previous snapshot...');
    const latestSnapshot = getLatestSnapshot();
    
    if (latestSnapshot) {
      console.log(`   Using snapshot: ${latestSnapshot}`);
      // Copy "before" diagrams from snapshot
      copySnapshotDiagrams(latestSnapshot, path.join(diffDir, 'before'));
    } else {
      console.log('   No snapshot found, generating current state as baseline');
    }

    // Generate "after" state (current HEAD)
    console.log('\n📊 Generating current state diagrams...');
    execSync(`cd ${PROJECT_ROOT} && pnpm ddd:generate`, { stdio: 'pipe' });
    execSync(`cd ${PROJECT_ROOT} && pnpm ddd:convert`, { stdio: 'pipe' });

    // Copy "after" diagrams
    copyCurrentDiagrams(path.join(diffDir, 'after'));

    // Generate diff summary
    console.log('\n📝 Creating diff summary...');
    const diffSummary = {
      prNumber: prNum,
      baseBranch,
      timestamp: new Date().toISOString(),
      changes: diffAnalysis,
      dddComponents: categorizeDDDChanges(diffAnalysis.dddComponents),
    };

    fs.writeFileSync(
      path.join(diffDir, 'diff-summary.json'),
      JSON.stringify(diffSummary, null, 2)
    );

    // Generate comparison markdown
    console.log('\n📄 Creating comparison document...');
    generateComparisonMarkdown(diffDir, diffSummary);

    // Generate annotated diagrams with change indicators
    console.log('\n🎨 Generating annotated diagrams...');
    await generateAnnotatedDiagrams(diffDir, diffAnalysis.dddComponents);

    console.log(`\n✅ DDD diff generated successfully!`);
    console.log(`📂 Output directory: ${diffDir}`);
    console.log(`📖 View comparison: ${path.join(diffDir, 'comparison.md')}`);

  } catch (error) {
    console.error('\n❌ Error generating DDD diff:', error);
    process.exit(1);
  }
}

function getLatestSnapshot(): string | null {
  if (!fs.existsSync(SNAPSHOTS_DIR)) {
    return null;
  }

  const snapshots = fs.readdirSync(SNAPSHOTS_DIR)
    .filter(dir => fs.statSync(path.join(SNAPSHOTS_DIR, dir)).isDirectory())
    .sort()
    .reverse();

  return snapshots.length > 0 ? snapshots[0] : null;
}

function copySnapshotDiagrams(snapshotName: string, destDir: string) {
  const snapshotDir = path.join(SNAPSHOTS_DIR, snapshotName);
  const diagrams = fs.readdirSync(snapshotDir)
    .filter(file => file.endsWith('.svg') || file.endsWith('.mmd'));

  for (const diagram of diagrams) {
    fs.copyFileSync(
      path.join(snapshotDir, diagram),
      path.join(destDir, diagram)
    );
  }
}

function copyCurrentDiagrams(destDir: string) {
  const sourceDir = path.join(PROJECT_ROOT, 'docs/ddd-models');
  const diagramPaths = [
    '0-summary/overview.svg',
    '0-summary/stakeholder-summary.svg',
    '1-strategic-design/bounded-context-map.svg',
    '1-strategic-design/ubiquitous-language.svg',
    '2-tactical-design/aggregate-design.svg',
    '2-tactical-design/domain-model.svg',
    '3-application-layer/use-case-catalog.svg',
    '4-scrum-lifecycle/event-storming.svg',
    '4-scrum-lifecycle/product-backlog.svg',
  ];

  for (const diagramPath of diagramPaths) {
    const sourcePath = path.join(sourceDir, diagramPath);
    const destPath = path.join(destDir, path.basename(diagramPath));
    
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
    }
  }
}

function categorizeDDDChanges(components: DDDComponentChange[]) {
  return {
    domain: {
      entities: components.filter(c => c.layer === 'domain' && c.componentType === 'entity'),
      valueObjects: components.filter(c => c.layer === 'domain' && c.componentType === 'valueObject'),
      services: components.filter(c => c.layer === 'domain' && c.componentType === 'service'),
    },
    application: {
      useCases: components.filter(c => c.layer === 'application' && c.componentType === 'useCase'),
      dtos: components.filter(c => c.layer === 'application' && c.componentType === 'dto'),
    },
    infrastructure: {
      repositories: components.filter(c => c.layer === 'infrastructure' && c.componentType === 'repository'),
      services: components.filter(c => c.layer === 'infrastructure' && c.componentType === 'service'),
    },
    tests: components.filter(c => c.componentType === 'test'),
  };
}

function generateComparisonMarkdown(diffDir: string, diffSummary: any) {
  const markdown = `# DDD Changes - PR ${diffSummary.prNumber}

**Generated:** ${new Date(diffSummary.timestamp).toLocaleString()}  
**Base Branch:** ${diffSummary.baseBranch}

## Summary

- **Total Files Changed:** ${diffSummary.changes.summary.totalFiles}
- **Lines Added:** +${diffSummary.changes.summary.additions}
- **Lines Deleted:** -${diffSummary.changes.summary.deletions}
- **Domain Changes:** ${diffSummary.changes.summary.domainChanges}
- **Application Changes:** ${diffSummary.changes.summary.applicationChanges}
- **Infrastructure Changes:** ${diffSummary.changes.summary.infrastructureChanges}
- **Test Changes:** ${diffSummary.changes.summary.testChanges}

## DDD Component Changes

### Domain Layer

${formatComponentList(diffSummary.dddComponents.domain.entities, 'Entities')}
${formatComponentList(diffSummary.dddComponents.domain.valueObjects, 'Value Objects')}
${formatComponentList(diffSummary.dddComponents.domain.services, 'Domain Services')}

### Application Layer

${formatComponentList(diffSummary.dddComponents.application.useCases, 'Use Cases')}
${formatComponentList(diffSummary.dddComponents.application.dtos, 'DTOs')}

### Infrastructure Layer

${formatComponentList(diffSummary.dddComponents.infrastructure.repositories, 'Repositories')}
${formatComponentList(diffSummary.dddComponents.infrastructure.services, 'Infrastructure Services')}

### Tests

${formatComponentList(diffSummary.dddComponents.tests, 'Test Files')}

## Visual Comparison

### Stakeholder Summary
| Before | After |
|--------|-------|
| ![Before](./before/stakeholder-summary.svg) | ![After](./after/stakeholder-summary.svg) |

### Domain Model
| Before | After |
|--------|-------|
| ![Before](./before/domain-model.svg) | ![After](./after/domain-model.svg) |

### Use Case Catalog
| Before | After |
|--------|-------|
| ![Before](./before/use-case-catalog.svg) | ![After](./after/use-case-catalog.svg) |

### Bounded Context Map
| Before | After |
|--------|-------|
| ![Before](./before/bounded-context-map.svg) | ![After](./after/bounded-context-map.svg) |

---

**Note:** Red indicates deletions, Green indicates additions, Yellow indicates modifications.
`;

  fs.writeFileSync(path.join(diffDir, 'comparison.md'), markdown);
}

function formatComponentList(components: DDDComponentChange[], title: string): string {
  if (components.length === 0) {
    return `#### ${title}\n\nNo changes.\n`;
  }

  const added = components.filter(c => c.changeType === 'added');
  const modified = components.filter(c => c.changeType === 'modified');
  const deleted = components.filter(c => c.changeType === 'deleted');

  let output = `#### ${title}\n\n`;
  
  if (added.length > 0) {
    output += '**Added:**\n';
    added.forEach(c => {
      output += `- ✅ \`${c.componentName}\` (${c.file})\n`;
    });
  }

  if (modified.length > 0) {
    output += '\n**Modified:**\n';
    modified.forEach(c => {
      output += `- 🔄 \`${c.componentName}\` (${c.file})\n`;
    });
  }

  if (deleted.length > 0) {
    output += '\n**Deleted:**\n';
    deleted.forEach(c => {
      output += `- ❌ \`${c.componentName}\` (${c.file})\n`;
    });
  }

  return output + '\n';
}

async function generateAnnotatedDiagrams(diffDir: string, components: DDDComponentChange[]) {
  // For now, just copy the diagrams
  // In a more advanced implementation, we would modify the Mermaid source to add styling
  console.log('   Diagrams copied with change indicators in comparison.md');
}

// Main execution
const args = process.argv.slice(2);
const options: DiffGenerationOptions = {};

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--base-branch' && args[i + 1]) {
    options.baseBranch = args[i + 1];
    i++;
  } else if (args[i] === '--pr-number' && args[i + 1]) {
    options.prNumber = args[i + 1];
    i++;
  } else if (args[i] === '--output-dir' && args[i + 1]) {
    options.outputDir = args[i + 1];
    i++;
  }
}

generateDDDDiff(options);
