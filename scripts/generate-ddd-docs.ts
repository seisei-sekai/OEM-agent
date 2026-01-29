#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { DomainAnalyzer } from './analyzers/domain-analyzer';
import { ApplicationAnalyzer } from './analyzers/application-analyzer';
import { PRDAnalyzer } from './analyzers/prd-analyzer';
import * as generators from './generators';

const PROJECT_ROOT = path.join(__dirname, '..');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'docs/ddd-models');

async function main() {
  console.log('🚀 Starting DDD documentation generation...\n');

  try {
    // Step 1: Analyze code
    console.log('📊 Step 1: Analyzing domain layer...');
    const domainAnalyzer = new DomainAnalyzer(PROJECT_ROOT);
    const domainData = domainAnalyzer.analyzeDomain();
    console.log(
      `   ✓ Found ${domainData.entities.length} entities, ${domainData.valueObjects.length} value objects, ${domainData.domainEvents.length} events`
    );

    console.log('\n📊 Step 2: Analyzing application layer...');
    const applicationAnalyzer = new ApplicationAnalyzer(PROJECT_ROOT);
    const applicationData = applicationAnalyzer.analyzeApplication();
    console.log(
      `   ✓ Found ${applicationData.useCases.length} use cases, ${applicationData.dtos.length} DTOs`
    );

    console.log('\n📊 Step 3: Analyzing PRD documents...');
    const prdAnalyzer = new PRDAnalyzer();
    const scrumData = prdAnalyzer.analyzePRD(PROJECT_ROOT);
    console.log(
      `   ✓ Found ${scrumData.epics.length} epics, ${scrumData.userStories.length} user stories, ${scrumData.sprints.length} sprints`
    );

    // Step 2: Generate Mermaid diagrams
    console.log('\n📝 Step 4: Generating Mermaid diagrams...\n');

    const diagrams = [
      {
        name: '0-summary/overview',
        content: generators.generateOverview(domainData, applicationData),
        description: 'System overview',
      },
      {
        name: '0-summary/stakeholder-summary',
        content: generators.generateStakeholderSummary(domainData, applicationData),
        description: 'Stakeholder summary',
      },
      {
        name: '1-strategic-design/bounded-context-map',
        content: generators.generateBoundedContextMap(),
        description: 'Bounded context map',
      },
      {
        name: '1-strategic-design/ubiquitous-language',
        content: generators.generateUbiquitousLanguage(domainData),
        description: 'Ubiquitous language',
      },
      {
        name: '2-tactical-design/aggregate-design',
        content: generators.generateAggregateDesign(domainData),
        description: 'Aggregate design',
      },
      {
        name: '2-tactical-design/domain-model',
        content: generators.generateDomainModel(domainData),
        description: 'Domain model',
      },
      {
        name: '3-application-layer/use-case-catalog',
        content: generators.generateUseCaseCatalog(applicationData),
        description: 'Use case catalog',
      },
      {
        name: '4-scrum-lifecycle/product-backlog',
        content: generators.generateProductBacklog(scrumData),
        description: 'Product backlog',
      },
      {
        name: '4-scrum-lifecycle/event-storming',
        content: generators.generateEventStorming(domainData),
        description: 'Event storming',
      },
    ];

    for (const diagram of diagrams) {
      const filePath = path.join(OUTPUT_DIR, `${diagram.name}.mmd`);
      fs.writeFileSync(filePath, diagram.content);
      console.log(`   ✓ Generated ${diagram.description} -> ${diagram.name}.mmd`);
    }

    // Step 3: Generate summary statistics
    console.log('\n📊 Step 5: Generating statistics...');
    const stats = {
      domain: {
        entities: domainData.entities.length,
        valueObjects: domainData.valueObjects.length,
        events: domainData.domainEvents.length,
        services: domainData.domainServices.length,
        repositories: domainData.repositories.length,
      },
      application: {
        useCases: applicationData.useCases.length,
        dtos: applicationData.dtos.length,
        interfaces: applicationData.interfaces.length,
      },
      scrum: {
        epics: scrumData.epics.length,
        userStories: scrumData.userStories.length,
        sprints: scrumData.sprints.length,
      },
    };

    const statsPath = path.join(OUTPUT_DIR, 'stats.json');
    fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
    console.log(`   ✓ Generated stats.json`);

    console.log('\n✅ DDD documentation generation completed!\n');
    console.log('📂 Generated files:');
    console.log(`   - ${diagrams.length} Mermaid diagrams (.mmd)`);
    console.log(`   - 1 statistics file (stats.json)`);
    console.log('\n💡 Next step: Run `pnpm ddd:convert` to generate SVG files\n');
  } catch (error) {
    console.error('\n❌ Error generating documentation:');
    console.error(error);
    process.exit(1);
  }
}

main();
