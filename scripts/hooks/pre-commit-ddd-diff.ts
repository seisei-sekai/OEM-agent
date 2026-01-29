#!/usr/bin/env tsx

/**
 * Pre-commit Hook: Generate DDD Diff Diagrams
 * 
 * Generates diff diagrams comparing current changes against the base branch.
 * The diff is saved with a timestamped directory name and automatically staged.
 */

import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

const PROJECT_ROOT = path.join(__dirname, '../..');
const CHANGES_DIR = path.join(PROJECT_ROOT, 'docs/ddd-changes');

async function main() {
  try {
    console.log('📊 Generating DDD diff diagrams...\n');

    // Get current branch
    const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
    }).trim();

    // Skip if on main/master branch
    if (currentBranch === 'main' || currentBranch === 'master') {
      console.log('⏭️  Skipping diff generation on main branch\n');
      return;
    }

    // Get current timestamp for directory name
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const shortHash = execSync('git rev-parse --short HEAD', {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
    }).trim();

    const diffDirName = `${timestamp}-${shortHash}`;
    const outputDir = path.join(CHANGES_DIR, diffDirName);

    // Check if we have staged changes
    const stagedFiles = execSync('git diff --cached --name-only', {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
    }).trim();

    if (!stagedFiles) {
      console.log('⏭️  No staged changes, skipping diff generation\n');
      return;
    }

    // Generate DDD diff
    console.log(`📂 Output directory: ${diffDirName}\n`);

    execSync(
      `tsx scripts/generators/generate-ddd-diff.ts --base-branch main --output-dir "${outputDir}"`,
      {
        cwd: PROJECT_ROOT,
        stdio: 'inherit',
      }
    );

    // Add generated diff to git staging
    if (fs.existsSync(outputDir)) {
      console.log('\n📦 Adding DDD diff to commit...');
      execSync(`git add "${outputDir}"`, {
        cwd: PROJECT_ROOT,
        stdio: 'inherit',
      });
      console.log('✅ DDD diff staged\n');
    }

  } catch (error) {
    console.error('❌ Error generating DDD diff:', error);
    // Don't fail the commit on diff generation errors
    console.log('⚠️  Continuing with commit (diff generation failed)\n');
  }
}

main();
