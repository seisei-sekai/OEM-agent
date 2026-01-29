import simpleGit, { DiffResult } from 'simple-git';
import * as path from 'path';
import * as fs from 'fs';

export interface FileChange {
  file: string;
  changeType: 'added' | 'modified' | 'deleted' | 'renamed';
  insertions: number;
  deletions: number;
}

export interface DDDComponentChange {
  layer: 'domain' | 'application' | 'infrastructure' | 'api' | 'other';
  componentType: 'entity' | 'valueObject' | 'useCase' | 'dto' | 'repository' | 'service' | 'test' | 'other';
  componentName: string;
  file: string;
  changeType: 'added' | 'modified' | 'deleted';
}

export interface GitDiffAnalysis {
  files: FileChange[];
  dddComponents: DDDComponentChange[];
  summary: {
    totalFiles: number;
    additions: number;
    deletions: number;
    domainChanges: number;
    applicationChanges: number;
    infrastructureChanges: number;
    testChanges: number;
  };
}

export class GitDiffAnalyzer {
  private git: ReturnType<typeof simpleGit>;
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.git = simpleGit(projectRoot);
  }

  /**
   * Analyze changes between two commits/branches
   */
  async analyzeDiff(from: string, to: string = 'HEAD'): Promise<GitDiffAnalysis> {
    const diffSummary = await this.git.diffSummary([from, to]);
    
    const allFiles: FileChange[] = diffSummary.files.map((file) => ({
      file: file.file,
      changeType: this.getChangeType(file),
      insertions: file.insertions,
      deletions: file.deletions,
    }));

    // Filter out non-functional files (docs, configs, diagrams)
    const files = allFiles.filter((file) => this.isFunctionalFile(file.file));

    const dddComponents = this.mapFilesToDDDComponents(files);

    const summary = {
      totalFiles: files.length,
      additions: files.reduce((sum, f) => sum + f.insertions, 0),
      deletions: files.reduce((sum, f) => sum + f.deletions, 0),
      domainChanges: dddComponents.filter((c) => c.layer === 'domain').length,
      applicationChanges: dddComponents.filter((c) => c.layer === 'application').length,
      infrastructureChanges: dddComponents.filter((c) => c.layer === 'infrastructure').length,
      testChanges: dddComponents.filter((c) => c.componentType === 'test').length,
    };

    return {
      files,
      dddComponents,
      summary,
    };
  }

  /**
   * Analyze staged changes (for pre-commit hook)
   */
  async analyzeStagedChanges(): Promise<GitDiffAnalysis> {
    const diffSummary = await this.git.diff(['--cached', '--numstat']);
    const allFiles = this.parseDiffNumstat(diffSummary);
    
    // Filter out non-functional files
    const files = allFiles.filter((file) => this.isFunctionalFile(file.file));
    
    const dddComponents = this.mapFilesToDDDComponents(files);

    const summary = {
      totalFiles: files.length,
      additions: files.reduce((sum, f) => sum + f.insertions, 0),
      deletions: files.reduce((sum, f) => sum + f.deletions, 0),
      domainChanges: dddComponents.filter((c) => c.layer === 'domain').length,
      applicationChanges: dddComponents.filter((c) => c.layer === 'application').length,
      infrastructureChanges: dddComponents.filter((c) => c.layer === 'infrastructure').length,
      testChanges: dddComponents.filter((c) => c.componentType === 'test').length,
    };

    return {
      files,
      dddComponents,
      summary,
    };
  }

  private parseDiffNumstat(output: string): FileChange[] {
    const lines = output.trim().split('\n');
    return lines
      .filter((line) => line.trim())
      .map((line) => {
        const [insertions, deletions, file] = line.split('\t');
        return {
          file,
          changeType: 'modified' as const,
          insertions: insertions === '-' ? 0 : parseInt(insertions, 10),
          deletions: deletions === '-' ? 0 : parseInt(deletions, 10),
        };
      });
  }

  private getChangeType(file: any): 'added' | 'modified' | 'deleted' | 'renamed' {
    if (file.binary) return 'modified';
    if (file.insertions > 0 && file.deletions === 0) return 'added';
    if (file.insertions === 0 && file.deletions > 0) return 'deleted';
    return 'modified';
  }

  /**
   * Check if a file is functional code (not docs, configs, diagrams, or workflow scripts)
   * Only counts core business logic in packages/ and apps/ directories
   */
  private isFunctionalFile(filePath: string): boolean {
    // Only include files in packages/ and apps/ directories (core business logic)
    if (!filePath.startsWith('packages/') && !filePath.startsWith('apps/')) {
      return false;
    }

    // Exclude documentation and diagram files
    const nonFunctionalPatterns = [
      /\.md$/i,                    // Markdown files
      /\.svg$/i,                   // SVG diagrams
      /\.mmd$/i,                   // Mermaid diagrams
      /\.json$/,                   // JSON files (configs, though package.json is borderline)
      /\.ya?ml$/,                  // YAML files (configs)
      /\.toml$/,                   // TOML files (configs)
      /\.lock$/,                   // Lock files
      /\.tsbuildinfo$/,            // TypeScript build info
      /CHANGELOG/i,                // Changelog
      /README/i,                   // README files
      /LICENSE/i,                  // License files
    ];

    // Check if file matches any non-functional pattern
    for (const pattern of nonFunctionalPatterns) {
      if (pattern.test(filePath)) {
        return false;
      }
    }

    // Only include actual code files
    const functionalExtensions = [
      '.ts', '.tsx', '.js', '.jsx',  // TypeScript/JavaScript
      '.py',                          // Python
      '.go',                          // Go
      '.rs',                          // Rust
      '.java',                        // Java
      '.c', '.cpp', '.h', '.hpp',    // C/C++
    ];

    return functionalExtensions.some((ext) => filePath.endsWith(ext));
  }

  private mapFilesToDDDComponents(files: FileChange[]): DDDComponentChange[] {
    const components: DDDComponentChange[] = [];

    for (const file of files) {
      const component = this.identifyDDDComponent(file);
      if (component) {
        components.push(component);
      }
    }

    return components;
  }

  private identifyDDDComponent(file: FileChange): DDDComponentChange | null {
    const filePath = file.file;

    // Determine layer
    let layer: DDDComponentChange['layer'] = 'other';
    if (filePath.includes('packages/domain')) layer = 'domain';
    else if (filePath.includes('packages/application')) layer = 'application';
    else if (filePath.includes('packages/infrastructure')) layer = 'infrastructure';
    else if (filePath.includes('apps/api')) layer = 'api';
    else return null; // Skip non-DDD files

    // Determine component type
    let componentType: DDDComponentChange['componentType'] = 'other';
    let componentName = '';

    if (filePath.includes('__tests__') || filePath.includes('.test.') || filePath.includes('.spec.')) {
      componentType = 'test';
      componentName = path.basename(filePath, path.extname(filePath));
    } else if (filePath.includes('/entities/')) {
      componentType = 'entity';
      componentName = path.basename(filePath, '.ts');
    } else if (filePath.includes('/value-objects/')) {
      componentType = 'valueObject';
      componentName = path.basename(filePath, '.ts');
    } else if (filePath.includes('/use-cases/')) {
      componentType = 'useCase';
      componentName = path.basename(filePath, '.ts');
    } else if (filePath.includes('/dtos/')) {
      componentType = 'dto';
      componentName = path.basename(filePath, '.ts');
    } else if (filePath.includes('/repositories/')) {
      componentType = 'repository';
      componentName = path.basename(filePath, '.ts');
    } else if (filePath.includes('/services/')) {
      componentType = 'service';
      componentName = path.basename(filePath, '.ts');
    }

    return {
      layer,
      componentType,
      componentName,
      file: filePath,
      changeType: file.changeType === 'renamed' ? 'modified' : file.changeType,
    };
  }

  /**
   * Get the list of files that have changed in the current branch compared to main
   */
  async getChangedFilesSinceBranch(baseBranch: string = 'main'): Promise<string[]> {
    try {
      const diff = await this.git.diff([`${baseBranch}...HEAD`, '--name-only']);
      return diff.split('\n').filter((file) => file.trim());
    } catch (error) {
      console.warn('Could not get changed files since branch:', error);
      return [];
    }
  }

  /**
   * Get detailed diff for a specific file
   */
  async getFileDiff(file: string, from: string = 'HEAD~1', to: string = 'HEAD'): Promise<string> {
    try {
      return await this.git.diff([from, to, '--', file]);
    } catch (error) {
      console.warn(`Could not get diff for file ${file}:`, error);
      return '';
    }
  }
}
