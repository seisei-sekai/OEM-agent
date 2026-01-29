import { Project, ClassDeclaration, SourceFile } from 'ts-morph';
import * as path from 'path';
import { ApplicationData, UseCase, DTO, Repository, Property, Method } from '../types';

export class ApplicationAnalyzer {
  private project: Project;

  constructor(projectRoot: string) {
    this.project = new Project({
      tsConfigFilePath: path.join(projectRoot, 'packages/application/tsconfig.json'),
    });
  }

  public analyzeApplication(): ApplicationData {
    return {
      useCases: this.extractUseCases(),
      dtos: this.extractDTOs(),
      interfaces: this.extractInterfaces(),
    };
  }

  private extractUseCases(): UseCase[] {
    const useCases: UseCase[] = [];
    const useCaseFiles = this.project.getSourceFiles('**/use-cases/*.ts');

    for (const file of useCaseFiles) {
      const classes = file.getClasses();
      for (const cls of classes) {
        const name = cls.getName();
        if (name && name.endsWith('UseCase') && !name.includes('test')) {
          useCases.push(this.parseUseCase(cls, file));
        }
      }
    }

    return useCases;
  }

  private parseUseCase(cls: ClassDeclaration, file: SourceFile): UseCase {
    const name = cls.getName()!;
    const methods = this.extractMethods(cls);
    const dependencies = this.extractDependencies(cls);

    return {
      name,
      filePath: file.getFilePath(),
      methods,
      dependencies,
    };
  }

  private extractDTOs(): DTO[] {
    const dtos: DTO[] = [];
    const dtoFiles = this.project.getSourceFiles('**/dtos/*.ts');

    for (const file of dtoFiles) {
      // Extract interfaces (DTOs are often interfaces)
      const interfaces = file.getInterfaces();
      for (const iface of interfaces) {
        const name = iface.getName();
        if (name && name.endsWith('DTO') && !name.includes('test')) {
          dtos.push({
            name,
            filePath: file.getFilePath(),
            properties: this.extractInterfaceProperties(iface),
          });
        }
      }

      // Also check for type aliases
      const typeAliases = file.getTypeAliases();
      for (const typeAlias of typeAliases) {
        const name = typeAlias.getName();
        if (name && name.endsWith('DTO') && !name.includes('test')) {
          dtos.push({
            name,
            filePath: file.getFilePath(),
            properties: [], // Type aliases are harder to parse, simplified here
          });
        }
      }
    }

    return dtos;
  }

  private extractInterfaces(): Repository[] {
    const interfaces: Repository[] = [];
    const interfaceFiles = this.project.getSourceFiles('**/interfaces/*.ts');

    for (const file of interfaceFiles) {
      const ifaces = file.getInterfaces();
      for (const iface of ifaces) {
        const name = iface.getName();
        if (name && name.startsWith('I') && !name.includes('test')) {
          interfaces.push({
            name,
            filePath: file.getFilePath(),
            methods: this.extractInterfaceMethods(iface),
            targetEntity: this.inferTargetFromInterface(name),
          });
        }
      }
    }

    return interfaces;
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

  private extractInterfaceProperties(iface: any): Property[] {
    const properties: Property[] = [];
    const props = iface.getProperties();

    for (const prop of props) {
      const name = prop.getName();
      const type = prop.getType().getText();
      const isOptional = prop.hasQuestionToken();

      properties.push({ name, type, isOptional });
    }

    return properties;
  }

  private extractDependencies(cls: ClassDeclaration): string[] {
    const dependencies: string[] = [];
    const constructor = cls.getConstructors()[0];

    if (constructor) {
      const params = constructor.getParameters();
      for (const param of params) {
        const type = param.getType().getText();
        dependencies.push(type);
      }
    }

    return dependencies;
  }

  private inferTargetFromInterface(name: string): string {
    // IAgentService -> Agent
    // IMockupGenerator -> Mockup
    return name
      .replace('I', '')
      .replace('Service', '')
      .replace('Generator', '')
      .replace('Extractor', '')
      .replace('Search', '');
  }
}
