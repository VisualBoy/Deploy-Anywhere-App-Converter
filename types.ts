export interface AppDefinition {
  id: string;
  name: string;
  description: string;
  image: string;
  category: string;
  compose: string; // The raw YAML content
  port_map?: string; // e.g. "8080:80"
  volume_map?: string; // e.g. "./data" or "/opt/app/data"
  env_vars?: Record<string, string>; // Extracted environment variables
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
  // LXC General
  password?: string;
  
  // Network
  hostPort: string;
  containerPort: string;
  bridge: string;
  useDhcp: boolean;
  staticIp: string; // e.g. 192.168.1.50/24
  gateway: string;

  // App Config
  volumePath: string;
  envVars: Record<string, string>;
  composeContent: string;
  
  // Proxmox specific resources
  cpuCores: number;
  ramSize: number; // in MB
  diskSize: number; // in GB
  storagePool: string; // e.g. local-lvm, local-zfs
}

export interface Repo {
  id: string;
  name: string;
  url?: string; // Source URL for the repository
  apps: AppDefinition[];
}