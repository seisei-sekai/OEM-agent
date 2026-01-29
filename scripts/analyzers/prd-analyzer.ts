import * as fs from 'fs';
import * as path from 'path';
import MarkdownIt from 'markdown-it';
import { ScrumData, Epic, UserStory, Sprint } from '../types';

export class PRDAnalyzer {
  private md: MarkdownIt;

  constructor() {
    this.md = new MarkdownIt();
  }

  public analyzePRD(projectRoot: string): ScrumData {
    const prdPath = path.join(projectRoot, 'Business/Feature/Floated-AI-Agent');
    const prdFiles = this.findPRDFiles(prdPath);

    let epics: Epic[] = [];
    let userStories: UserStory[] = [];
    let sprints: Sprint[] = [];

    for (const file of prdFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const parsed = this.parsePRDContent(content, file);

      epics = epics.concat(parsed.epics);
      userStories = userStories.concat(parsed.userStories);
      sprints = sprints.concat(parsed.sprints);
    }

    return { epics, userStories, sprints };
  }

  private findPRDFiles(dirPath: string): string[] {
    const files: string[] = [];

    if (fs.existsSync(dirPath)) {
      const entries = fs.readdirSync(dirPath);
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry);
        if (entry.startsWith('PRD') && entry.endsWith('.md')) {
          files.push(fullPath);
        }
      }
    }

    return files;
  }

  private parsePRDContent(
    content: string,
    filePath: string
  ): { epics: Epic[]; userStories: UserStory[]; sprints: Sprint[] } {
    const epics: Epic[] = [];
    const userStories: UserStory[] = [];
    const sprints: Sprint[] = [];

    // Parse sections
    const sections = this.extractSections(content);

    // Extract implementation roadmap as sprints
    const roadmapSection = sections.find((s) =>
      s.title.toLowerCase().includes('roadmap')
    );
    if (roadmapSection) {
      sprints.push(...this.extractSprints(roadmapSection.content));
    }

    // Extract core components as epics
    const componentSection = sections.find(
      (s) =>
        s.title.toLowerCase().includes('component') ||
        s.title.toLowerCase().includes('feature')
    );
    if (componentSection) {
      epics.push(...this.extractEpics(componentSection.content));
    }

    // Extract user interaction flows as user stories
    const flowSection = sections.find(
      (s) =>
        s.title.toLowerCase().includes('flow') ||
        s.title.toLowerCase().includes('interaction')
    );
    if (flowSection) {
      userStories.push(...this.extractUserStories(flowSection.content, 'User Flow'));
    }

    return { epics, userStories, sprints };
  }

  private extractSections(content: string): Array<{ title: string; content: string }> {
    const sections: Array<{ title: string; content: string }> = [];
    const lines = content.split('\n');

    let currentSection: { title: string; content: string } | null = null;

    for (const line of lines) {
      if (line.startsWith('## ')) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          title: line.replace('## ', '').trim(),
          content: '',
        };
      } else if (currentSection) {
        currentSection.content += line + '\n';
      }
    }

    if (currentSection) {
      sections.push(currentSection);
    }

    return sections;
  }

  private extractSprints(content: string): Sprint[] {
    const sprints: Sprint[] = [];
    const phaseRegex = /### Phase (\d+):(.*?)\(Weeks? ([\d-]+)\)/gi;

    let match;
    let sprintNumber = 1;

    while ((match = phaseRegex.exec(content)) !== null) {
      const phaseName = match[2].trim();
      const weeks = match[3];

      // Extract tasks from this phase
      const phaseStart = match.index;
      const nextPhaseMatch = phaseRegex.exec(content);
      const phaseEnd = nextPhaseMatch ? nextPhaseMatch.index : content.length;
      phaseRegex.lastIndex = phaseStart + match[0].length; // Reset for next iteration

      const phaseContent = content.substring(phaseStart, phaseEnd);
      const tasks = this.extractTasks(phaseContent);

      // Determine status based on checkmarks
      const completedTasks = tasks.filter((t) => t.startsWith('✅')).length;
      const status =
        completedTasks === tasks.length
          ? 'done'
          : completedTasks > 0
            ? 'active'
            : 'planned';

      sprints.push({
        number: sprintNumber++,
        startDate: this.calculateStartDate(weeks),
        endDate: this.calculateEndDate(weeks),
        tasks: tasks.map((t) => t.replace(/^[✅-]\s*/, '')),
        status: status as 'done' | 'active' | 'planned',
      });
    }

    return sprints;
  }

  private extractEpics(content: string): Epic[] {
    const epics: Epic[] = [];
    const epicRegex = /###\s+([\d.]+)\s+(.*)/g;

    let match;
    while ((match = epicRegex.exec(content)) !== null) {
      const name = match[2].trim();
      const features = this.extractFeatures(content, match.index);

      epics.push({
        name,
        description: name,
        features,
      });
    }

    // If no explicit epics found, create from major sections
    if (epics.length === 0) {
      epics.push({
        name: 'Floating AI Agent',
        description: 'Core floating AI agent button system',
        features: [
          'Floating Button Component',
          'Chat Modal Interface',
          'Message Streaming',
          'Chat History',
        ],
      });

      epics.push({
        name: 'Branding Features',
        description: 'Logo extraction and branding intelligence',
        features: [
          'Logo Upload',
          'URL Scraping',
          'Vision AI Integration',
          'Branding Info Card',
        ],
      });

      epics.push({
        name: 'Product Integration',
        description: 'Product catalog and recommendations',
        features: [
          'Product Catalog API',
          'Vector Search',
          'Mockup Generation',
          'Product Grid Display',
        ],
      });
    }

    return epics;
  }

  private extractUserStories(content: string, epic: string): UserStory[] {
    const stories: UserStory[] = [];
    // Extract flow descriptions
    const flowRegex = /### ([\d.]+) Flow:(.*?)(?=###|$)/gs;

    let match;
    let storyId = 1;

    while ((match = flowRegex.exec(content)) !== null) {
      const title = match[2].trim();
      const flowContent = match[0];

      stories.push({
        id: `US-${storyId++}`,
        title,
        description: `As a user, I want to ${title.toLowerCase()}`,
        acceptanceCriteria: this.extractAcceptanceCriteria(flowContent),
        epic,
      });
    }

    return stories;
  }

  private extractTasks(content: string): string[] {
    const tasks: string[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      if (line.trim().startsWith('- ✅') || line.trim().startsWith('- ')) {
        tasks.push(line.trim().substring(2).trim());
      }
    }

    return tasks;
  }

  private extractFeatures(content: string, startIndex: number): string[] {
    const features: string[] = [];
    const lines = content.substring(startIndex).split('\n').slice(1, 10); // Get next few lines

    for (const line of lines) {
      if (line.trim().startsWith('-')) {
        features.push(line.trim().substring(1).trim());
      } else if (line.startsWith('###')) {
        break; // Stop at next section
      }
    }

    return features;
  }

  private extractAcceptanceCriteria(content: string): string[] {
    const criteria: string[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        criteria.push(line.trim().substring(2));
      }
    }

    return criteria.length > 0
      ? criteria
      : ['Feature is implemented', 'Tests pass', 'UI is responsive'];
  }

  private calculateStartDate(weeks: string): string {
    // Parse weeks like "1-2" or "3"
    const baseDate = new Date('2026-01-23');
    const weekNum = parseInt(weeks.split('-')[0]);
    const startDate = new Date(baseDate);
    startDate.setDate(startDate.getDate() + (weekNum - 1) * 7);
    return startDate.toISOString().split('T')[0];
  }

  private calculateEndDate(weeks: string): string {
    // Parse weeks like "1-2" or "3"
    const baseDate = new Date('2026-01-23');
    const weekNums = weeks.split('-').map((w) => parseInt(w));
    const endWeek = weekNums[weekNums.length - 1];
    const endDate = new Date(baseDate);
    endDate.setDate(endDate.getDate() + endWeek * 7);
    return endDate.toISOString().split('T')[0];
  }
}
