#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const PROJECT_ROOT = path.join(__dirname, '..');
const DOCS_DIR = path.join(PROJECT_ROOT, 'docs/ddd-models');

async function main() {
  console.log('🎨 Starting Mermaid to SVG conversion...\n');

  try {
    // Find all .mmd files
    const mmdFiles = findMermaidFiles(DOCS_DIR);

    if (mmdFiles.length === 0) {
      console.log('⚠️  No .mmd files found. Run `pnpm ddd:generate` first.\n');
      process.exit(1);
    }

    console.log(`📁 Found ${mmdFiles.length} Mermaid files to convert\n`);

    let converted = 0;
    let failed = 0;

    for (const mmdFile of mmdFiles) {
      const svgFile = mmdFile.replace('.mmd', '.svg');
      const relativePath = path.relative(PROJECT_ROOT, mmdFile);

      try {
        console.log(`   Converting ${relativePath}...`);

        // Use mmdc (Mermaid CLI) to convert
        execSync(`npx -y mmdc -i "${mmdFile}" -o "${svgFile}" -t default -b transparent`, {
          stdio: 'pipe',
        });

        if (fs.existsSync(svgFile)) {
          const stats = fs.statSync(svgFile);
          console.log(`   ✓ Generated ${path.basename(svgFile)} (${formatBytes(stats.size)})`);
          converted++;
        } else {
          console.log(`   ✗ Failed to generate ${path.basename(svgFile)}`);
          failed++;
        }
      } catch (error: any) {
        console.log(`   ✗ Error converting ${relativePath}: ${error.message}`);
        failed++;
      }
    }

    console.log(`\n✅ Conversion completed!`);
    console.log(`   ✓ Converted: ${converted} files`);
    if (failed > 0) {
      console.log(`   ✗ Failed: ${failed} files`);
    }

    console.log('\n📂 Generated SVG files in docs/ddd-models/\n');
  } catch (error) {
    console.error('\n❌ Error during conversion:');
    console.error(error);
    process.exit(1);
  }
}

function findMermaidFiles(dir: string): string[] {
  const files: string[] = [];

  function walk(currentPath: string) {
    if (!fs.existsSync(currentPath)) {
      return;
    }

    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.mmd')) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

main();
