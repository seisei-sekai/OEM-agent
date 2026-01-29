// Type definitions for DDD documentation generation

export interface Entity {
  name: string;
  filePath: string;
  properties: Property[];
  methods: Method[];
  isAggregateRoot: boolean;
  relationships: Relationship[];
}

export interface ValueObject {
  name: string;
  filePath: string;
  properties: Property[];
  methods: Method[];
}

export interface DomainEvent {
  name: string;
  filePath: string;
  properties: Property[];
  description?: string;
}

export interface DomainService {
  name: string;
  filePath: string;
  methods: Method[];
}

export interface Repository {
  name: string;
  filePath: string;
  methods: Method[];
  targetEntity: string;
}

export interface UseCase {
  name: string;
  filePath: string;
  methods: Method[];
  dependencies: string[];
}

export interface DTO {
  name: string;
  filePath: string;
  properties: Property[];
}

export interface Property {
  name: string;
  type: string;
  isOptional: boolean;
}

export interface Method {
  name: string;
  parameters: Property[];
  returnType: string;
}

export interface Relationship {
  target: string;
  type: 'contains' | 'references' | 'uses';
  cardinality?: '1' | '*';
}

export interface DomainData {
  entities: Entity[];
  valueObjects: ValueObject[];
  domainEvents: DomainEvent[];
  domainServices: DomainService[];
  repositories: Repository[];
}

export interface ApplicationData {
  useCases: UseCase[];
  dtos: DTO[];
  interfaces: Repository[];
}

export interface ScrumData {
  epics: Epic[];
  userStories: UserStory[];
  sprints: Sprint[];
}

export interface Epic {
  name: string;
  description: string;
  features: string[];
}

export interface UserStory {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  epic: string;
}

export interface Sprint {
  number: number;
  startDate: string;
  endDate: string;
  tasks: string[];
  status: 'done' | 'active' | 'planned';
}
