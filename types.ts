export interface AppDefinition {
  id: string;
  name: string;
  description: string;
  tagline?: string;
  image: string;
  thumbnail?: string;
  category: string;
  compose: string; 
  port_map?: string;
  volume_map?: string;
  env_vars?: Record<string, string>;
  version?: string;
  developer?: string;
  author?: string;
  youtube?: string;
  docs_link?: string;
  website?: string;
  support_link?: string;
  repo_link?: string;
  screenshots?: string[];
  architectures?: string[];
  main_service?: string;
}

export enum TargetPlatform {
  PROXMOX_LXC = 'PROXMOX_LXC',
  DOCKGE = 'DOCKGE',
  PORTAINER = 'PORTAINER',
  RAW_COMPOSE = 'RAW_COMPOSE'
}

export interface DeploymentConfig {
  appId: string;
  appName: string;
  target: TargetPlatform;
  password?: string;
  ctId: number;
  hostPort: string;
  containerPort: string;
  bridge: string;
  useDhcp: boolean;
  staticIp: string;
  gateway: string;
  volumePath: string;
  envVars: Record<string, string>;
  composeContent: string;
  cpuCores: number;
  ramSize: number;
  diskSize: number;
  storagePool: string;
}

export interface Repo {
  id: string;
  name: string;
  url?: string;
  apps: AppDefinition[];
  lastSynced?: number;
}

export interface CasaOSMetadata {
    main?: string;
    title?: { en_us: string };
    description?: { en_us: string };
    tagline?: { en_us: string };
    icon?: string;
    thumbnail?: string;
    category?: string;
    port_map?: string;
    author?: string;
    developer?: string;
    screenshot_link?: string[];
    project_url?: string;
    index?: string;
    architectures?: string[];
}

export interface UmbrelMetadata {
    id: string;
    name: string;
    version: string;
    tagline: string;
    description: string;
    developer: string;
    website: string;
    repo: string;
    support: string;
    port: number;
    category: string;
    gallery?: string[];
}

export interface ConfigJsonMetadata {
    id?: string;
    name?: string;
    title?: string;
    description?: string;
    tagline?: string;
    icon?: string;
    category?: string;
    port?: string | number;
    author?: string;
    developer?: string;
    version?: string;
    screenshots?: string[];
    image?: string;
    youtube?: string;
    docs_link?: string;
}