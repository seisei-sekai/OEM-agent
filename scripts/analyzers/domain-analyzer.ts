import { Project, ClassDeclaration, SourceFile } from 'ts-morph';
import * as path from 'path';
import {
  Entity,
  ValueObject,
  DomainEvent,
  DomainService,
  Repository,
  DomainData,
  Property,
  Method,
  Relationship,
} from '../types';

export class DomainAnalyzer {
  private project: Project;

  constructor(projectRoot: string) {
    this.project = new Project({
      tsConfigFilePath: path.join(projectRoot, 'packages/domain/tsconfig.json'),
    });
  }

  public analyzeDomain(): DomainData {
    const domainPath = path.join(
      this.project.getCompilerOptions().configFilePath!,
      '../src'
    );

    return {
      entities: this.extractEntities(),
      valueObjects: this.extractValueObjects(),
      domainEvents: this.extractDomainEvents(),
      domainServices: this.extractDomainServices(),
      repositories: this.extractRepositories(),
    };
  }

  private extractEntities(): Entity[] {
    const entities: Entity[] = [];
    const entityFiles = this.project.getSourceFiles('**/entities/*.ts');

    for (const file of entityFiles) {
      const classes = file.getClasses();
      for (const cls of classes) {
        if (cls.getName() && !cls.getName()!.includes('test')) {
          entities.push(this.parseEntity(cls, file));
        }
      }
    }

    return entities;
  }

  private parseEntity(cls: ClassDeclaration, file: SourceFile): Entity {
    const name = cls.getName()!;
    const properties = this.extractProperties(cls);
    const methods = this.extractMethods(cls);
    const relationships = this.extractRelationships(cls);

    // Check if it's an aggregate root (has methods that modify internal state)
    const isAggregateRoot = methods.some(
      (m) =>
        m.name.startsWith('create') ||
        m.name.startsWith('add') ||
        m.name.startsWith('update')
    );

    return {
      name,
      filePath: file.getFilePath(),
      properties,
      methods,
      isAggregateRoot,
      relationships,
    };
  }

  private extractValueObjects(): ValueObject[] {
    const valueObjects: ValueObject[] = [];
    const voFiles = this.project.getSourceFiles('**/value-objects/*.ts');

    for (const file of voFiles) {
      const classes = file.getClasses();
      for (const cls of classes) {
        if (cls.getName() && !cls.getName()!.includes('test')) {
          valueObjects.push({
            name: cls.getName()!,
            filePath: file.getFilePath(),
            properties: this.extractProperties(cls),
            methods: this.extractMethods(cls),
          });
        }
      }
    }

    return valueObjects;
  }

  private extractDomainEvents(): DomainEvent[] {
    const events: DomainEvent[] = [];
    const eventFiles = this.project.getSourceFiles('**/events/*.ts');

    for (const file of eventFiles) {
      const classes = file.getClasses();
      for (const cls of classes) {
        const name = cls.getName();
        if (name && name !== 'DomainEvent' && !name.includes('test')) {
          events.push({
            name,
            filePath: file.getFilePath(),
            properties: this.extractProperties(cls),
            description: this.extractJsDocDescription(cls),
          });
        }
      }
    }

    return events;
  }

  private extractDomainServices(): DomainService[] {
    const services: DomainService[] = [];
    const serviceFiles = this.project.getSourceFiles('**/services/*.ts');

    for (const file of serviceFiles) {
      const classes = file.getClasses();
      for (const cls of classes) {
        if (cls.getName() && !cls.getName()!.includes('test')) {
          services.push({
            name: cls.getName()!,
            filePath: file.getFilePath(),
            methods: this.extractMethods(cls),
          });
        }
      }
    }

    return services;
  }

  private extractRepositories(): Repository[] {
    const repositories: Repository[] = [];
    const repoFiles = this.project.getSourceFiles('**/repositories/*.ts');

    for (const file of repoFiles) {
      const interfaces = file.getInterfaces();
      for (const iface of interfaces) {
        const name = iface.getName();
        if (name && name.startsWith('I') && !name.includes('test')) {
          const targetEntity = this.inferTargetEntity(name);
          repositories.push({
            name,
            filePath: file.getFilePath(),
            methods: this.extractInterfaceMethods(iface),
            targetEntity,
          });
        }
      }
    }

    return repositories;
  }

  private extractProperties(cls: ClassDeclaration): Property[] {
    const properties: Property[] = [];
    const props = cls.getProperties();

    for (const prop of props) {
      const name = prop.getName();
      const type = prop.getType().getText();
      const isOptional = prop.hasQuestionToken() || false;

      if (!name.startsWith('_')) {
        // Skip private properties
        properties.push({ name, type, isOptional });
      }
    }

    return properties;
  }

  private extractMethods(cls: ClassDeclaration): Method[] {
    const methods: Method[] = [];
    const methodDecls = cls.getMethods();

    for (const method of methodDecls) {
      const name = method.getName();
      if (method.getScope() === 'public' || !method.getScope()) {
        const parameters: Property[] = method.getParameters().map((param) => ({
          name: param.getName(),
          type: param.getType().getText(),
          isOptional: param.isOptional(),
        }));

        const returnType = method.getReturnType().getText();

        methods.push({ name, parameters, returnType });
      }
    }

    return methods;
  }

  private extractInterfaceMethods(iface: any): Method[] {
    const methods: Method[] = [];
    const methodSigs = iface.getMethods();

    for (const method of methodSigs) {
      const name = method.getName();
      const parameters: Property[] = method.getParameters().map((param: any) => ({
        name: param.getName(),
        type: param.getType().getText(),
        isOptional: param.isOptional(),
      }));

      const returnType = method.getReturnType().getText();
      methods.push({ name, parameters, returnType });
    }

    return methods;
  }

  private extractRelationships(cls: ClassDeclaration): Relationship[] {
    const relationships: Relationship[] = [];
    const properties = cls.getProperties();

    for (const prop of properties) {
      const type = prop.getType().getText();

      // Check for array types
      if (type.includes('[]')) {
        const targetType = type.replace('[]', '').trim();
        if (this.isPossiblyDomainType(targetType)) {
          relationships.push({
            target: targetType,
            type: 'contains',
            cardinality: '*',
          });
        }
      } else if (this.isPossiblyDomainType(type)) {
        relationships.push({
          target: type,
          type: 'references',
          cardinality: '1',
        });
      }
    }

    return relationships;
  }

  private isPossiblyDomainType(type: string): boolean {
    // Check if it's likely a domain type (not primitive or common library type)
    const primitives = [
      'string',
      'number',
      'boolean',
      'Date',
      'void',
      'any',
      'unknown',
      'null',
      'undefined',
    ];
    return (
      !primitives.includes(type) &&
      !type.includes('Promise') &&
      !type.includes('|') &&
      !type.includes('&') &&
      type.length > 0 &&
      type[0] === type[0].toUpperCase()
    );
  }

  private inferTargetEntity(repoName: string): string {
    // I  ChatSessionRepository -> ChatSession
    return repoName.replace('I', '').replace('Repository', '');
  }

  private extractJsDocDescription(cls: ClassDeclaration): string | undefined {
    const jsDocs = cls.getJsDocs();
    if (jsDocs.length > 0) {
      return jsDocs[0].getDescription().trim();
    }
    return undefined;
  }
}
