#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import simpleGit from 'simple-git';

const PROJECT_ROOT = path.join(__dirname, '../..');
const SNAPSHOTS_DIR = path.join(PROJECT_ROOT, 'docs/ddd-snapshots');
const git = simpleGit(PROJECT_ROOT);

interface SnapshotMetadata {
  timestamp: string;
  commitSha: string;
  branch: string;
  author: string;
  changedFiles: string[];
  message: string;
}

async function generateSnapshot() {
  try {
    console.log('📸 Generating DDD snapshot...');

    // Get git information
    const status = await git.status();
    const log = await git.log({ n: 1 });
    const currentBranch = status.current || 'unknown';
    const lastCommit = log.latest;

    // Generate short SHA (or use staged files hash if no commits yet)
    let commitSha = 'initial';
    let author = 'unknown';
    let message = 'Initial commit';

    if (lastCommit) {
      commitSha = lastCommit.hash.substring(0, 7);
      author = lastCommit.author_name;
      message = lastCommit.message;
    }

    // Create timestamp
    const now = new Date();
    const timestamp = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const snapshotDir = path.join(SNAPSHOTS_DIR, `${timestamp}-${commitSha}`);

    // Check if snapshot already exists
    if (fs.existsSync(snapshotDir)) {
      console.log(`   ℹ️  Snapshot already exists: ${timestamp}-${commitSha}`);
      return;
    }

    // Create snapshot directory
    fs.mkdirSync(snapshotDir, { recursive: true });

    // Get list of changed files
    const changedFiles = [
      ...status.modified,
      ...status.created,
      ...status.deleted,
      ...status.renamed.map((r: any) => r.to),
    ];

    // Generate metadata
    const metadata: SnapshotMetadata = {
      timestamp: now.toISOString(),
      commitSha,
      branch: currentBranch,
      author,
      changedFiles,
      message,
    };

    fs.writeFileSync(
      path.join(snapshotDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );

    // Generate DDD diagrams
    console.log('   📊 Generating diagrams...');

    try {
      // Run DDD generation with custom output directory
      const generateCmd = `cd ${PROJECT_ROOT} && pnpm ddd:generate`;
      execSync(generateCmd, { stdio: 'pipe' });

      // Copy generated diagrams to snapshot directory
      const sourceDir = path.join(PROJECT_ROOT, 'docs/ddd-models');
      const diagramFiles = [
        '0-summary/overview.mmd',
        '0-summary/overview.svg',
        '0-summary/stakeholder-summary.mmd',
        '0-summary/stakeholder-summary.svg',
        '1-strategic-design/bounded-context-map.mmd',
        '1-strategic-design/bounded-context-map.svg',
        '1-strategic-design/ubiquitous-language.mmd',
        '1-strategic-design/ubiquitous-language.svg',
        '2-tactical-design/aggregate-design.mmd',
        '2-tactical-design/aggregate-design.svg',
        '2-tactical-design/domain-model.mmd',
        '2-tactical-design/domain-model.svg',
        '3-application-layer/use-case-catalog.mmd',
        '3-application-layer/use-case-catalog.svg',
        '4-scrum-lifecycle/event-storming.mmd',
        '4-scrum-lifecycle/event-storming.svg',
        '4-scrum-lifecycle/product-backlog.mmd',
        '4-scrum-lifecycle/product-backlog.svg',
      ];

      for (const file of diagramFiles) {
        const sourcePath = path.join(sourceDir, file);
        const destPath = path.join(snapshotDir, path.basename(file));

        if (fs.existsSync(sourcePath)) {
          fs.copyFileSync(sourcePath, destPath);
        }
      }

      // Copy stats.json
      const statsPath = path.join(sourceDir, 'stats.json');
      if (fs.existsSync(statsPath)) {
        fs.copyFileSync(statsPath, path.join(snapshotDir, 'stats.json'));
      }

      console.log(`   ✅ Snapshot created: ${timestamp}-${commitSha}`);

      // Stage the snapshot directory
      await git.add([snapshotDir]);
      console.log('   📝 Snapshot staged for commit');

    } catch (error) {
      console.error('   ❌ Error generating diagrams:', error);
      // Clean up partial snapshot
      if (fs.existsSync(snapshotDir)) {
        fs.rmSync(snapshotDir, { recursive: true, force: true });
      }
      throw error;
    }

  } catch (error) {
    console.error('❌ Error creating snapshot:', error);
    process.exit(1);
  }
}

// Run snapshot generation
generateSnapshot();
