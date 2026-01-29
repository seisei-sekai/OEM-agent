#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { execSync } from 'child_process';
import simpleGit from 'simple-git';

const PROJECT_ROOT = path.join(__dirname, '../..');
const git = simpleGit(PROJECT_ROOT);

interface WorkflowState {
  featureName: string;
  step: 'init' | 'requirement' | 'design' | 'tests' | 'stubs' | 'implementation' | 'pr';
  featureDir: string;
}

async function runTDDWorkflow(featureName?: string) {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║                                                          ║');
  console.log('║        🚀 TDD Workflow - From Scrum to PR               ║');
  console.log('║                                                          ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  try {
    // Step 1: Initialize feature
    const feature = featureName || await promptForFeatureName();
    const state: WorkflowState = {
      featureName: feature,
      step: 'init',
      featureDir: path.join(PROJECT_ROOT, 'Business/Features', feature),
    };

    console.log(`\n📦 Feature: ${feature}\n`);

    // Step 2: Create feature structure
    await initializeFeature(state);

    // Step 3: Requirement (manual)
    await promptRequirement(state);

    // Step 4: Generate design
    await generateDesign(state);

    // Step 5: Generate tests
    await generateTests(state);

    // Step 6: Generate code stubs
    await generateStubs(state);

    // Step 7: Implementation phase
    await implementationPhase(state);

    // Step 8: Prepare PR
    await preparePR(state);

    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║                                                          ║');
    console.log('║        ✅ TDD Workflow Complete!                        ║');
    console.log('║                                                          ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n❌ Workflow error:', error);
    process.exit(1);
  }
}

async function promptForFeatureName(): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('Enter feature name (e.g., user-authentication): ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function initializeFeature(state: WorkflowState) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Step 1: Initialize Feature Structure');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Create feature directory
  fs.mkdirSync(state.featureDir, { recursive: true });

  // Copy requirement template
  const templatePath = path.join(PROJECT_ROOT, 'templates/scrum/requirement-template.md');
  const requirementPath = path.join(state.featureDir, 'requirement.md');

  let template = fs.readFileSync(templatePath, 'utf-8');
  
  // Replace placeholders
  template = template.replace('[Feature Name]', state.featureName);
  template = template.replace('[DATE]', new Date().toISOString().split('T')[0]);

  fs.writeFileSync(requirementPath, template);

  // Create feature branch
  try {
    await git.checkoutLocalBranch(`feature/${state.featureName}`);
    console.log(`✅ Created branch: feature/${state.featureName}`);
  } catch (error) {
    console.log(`ℹ️  Branch feature/${state.featureName} already exists`);
  }

  console.log(`✅ Feature directory: ${state.featureDir}`);
  console.log(`✅ Requirement template: ${requirementPath}`);

  state.step = 'requirement';
}

async function promptRequirement(state: WorkflowState) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Step 2: Fill Requirements (Manual Step)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const requirementPath = path.join(state.featureDir, 'requirement.md');
  console.log(`📝 Please fill out the requirement document:`);
  console.log(`   ${requirementPath}\n`);

  console.log('Include:');
  console.log('  - User story');
  console.log('  - Acceptance criteria');
  console.log('  - Domain/Application/Infrastructure changes');
  console.log('  - Notion link');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  await new Promise<void>((resolve) => {
    rl.question('\nPress Enter when requirements are filled out...', () => {
      rl.close();
      resolve();
    });
  });

  console.log('✅ Requirements ready');
  state.step = 'design';
}

async function generateDesign(state: WorkflowState) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Step 3: Generate Design Document');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  execSync(`pnpm workflow:generate-design ${state.featureName}`, {
    cwd: PROJECT_ROOT,
    stdio: 'inherit',
  });

  console.log('\n✅ Design generated');
  state.step = 'tests';
}

async function generateTests(state: WorkflowState) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Step 4: Generate Test Cases (TDD - Red Phase)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  execSync(`pnpm workflow:generate-tests ${state.featureName}`, {
    cwd: PROJECT_ROOT,
    stdio: 'inherit',
  });

  console.log('\n✅ Tests generated');
  state.step = 'stubs';
}

async function generateStubs(state: WorkflowState) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Step 5: Generate Code Stubs');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  execSync(`pnpm workflow:generate-stubs ${state.featureName}`, {
    cwd: PROJECT_ROOT,
    stdio: 'inherit',
  });

  // Verify tests fail (Red phase)
  console.log('\n🧪 Verifying tests fail (Red phase)...');
  try {
    execSync('pnpm test', { cwd: PROJECT_ROOT, stdio: 'pipe' });
    console.log('⚠️  Tests passed - this is unexpected (stubs should not pass tests)');
  } catch {
    console.log('✅ Tests failing as expected (Red phase)');
  }

  console.log('\n✅ Code stubs generated');
  state.step = 'implementation';
}

async function implementationPhase(state: WorkflowState) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Step 6: Implementation Phase (TDD - Green Phase)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('📝 Implement the TODOs in generated files:');
  console.log('   - packages/domain/src/entities/');
  console.log('   - packages/domain/src/value-objects/');
  console.log('   - packages/application/src/use-cases/\n');

  console.log('🎯 Goal: Make all tests pass (Green phase)\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  await new Promise<void>((resolve) => {
    const checkTests = () => {
      rl.question('Run tests now? (y/n): ', async (answer) => {
        if (answer.toLowerCase() === 'y') {
          console.log('\n🧪 Running tests...\n');
          try {
            execSync('pnpm test', { cwd: PROJECT_ROOT, stdio: 'inherit' });
            console.log('\n✅ All tests passed!');
            rl.question('\nTests passing. Continue to PR? (y/n): ', (continueAnswer) => {
              if (continueAnswer.toLowerCase() === 'y') {
                rl.close();
                resolve();
              } else {
                checkTests();
              }
            });
          } catch {
            console.log('\n❌ Some tests failed');
            rl.question('\nContinue implementing? (y/n): ', (retryAnswer) => {
              if (retryAnswer.toLowerCase() === 'y') {
                checkTests();
              } else {
                rl.close();
                process.exit(1);
              }
            });
          }
        } else {
          rl.close();
          resolve();
        }
      });
    };

    checkTests();
  });

  state.step = 'pr';
}

async function preparePR(state: WorkflowState) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Step 7: Prepare Pull Request');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Commit changes
  console.log('📝 Committing changes...');
  await git.add('.');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const commitMessage = await new Promise<string>((resolve) => {
    rl.question('Commit message: ', (answer) => {
      rl.close();
      resolve(answer.trim() || `feat: implement ${state.featureName}`);
    });
  });

  try {
    await git.commit(commitMessage);
    console.log('✅ Changes committed');
  } catch (error) {
    console.log('ℹ️  No changes to commit or already committed');
  }

  // Push branch
  console.log('\n📤 Pushing to remote...');
  try {
    await git.push('origin', `feature/${state.featureName}`);
    console.log('✅ Branch pushed');
  } catch (error: any) {
    if (error.message.includes('no upstream')) {
      await git.push('origin', `feature/${state.featureName}`, ['--set-upstream']);
      console.log('✅ Branch pushed (upstream set)');
    } else {
      console.warn('⚠️  Push failed:', error.message);
    }
  }

  // Prepare and create PR
  console.log('\n🔄 Creating pull request...');
  execSync(`pnpm workflow:prepare-pr --title "feat: ${state.featureName}"`, {
    cwd: PROJECT_ROOT,
    stdio: 'inherit',
  });
}

// Main execution
const featureName = process.argv[2];
runTDDWorkflow(featureName);
