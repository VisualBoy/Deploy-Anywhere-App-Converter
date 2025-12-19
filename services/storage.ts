import { Repo, DeploymentConfig, TargetPlatform } from '../types';
import { REPOSITORIES as DEFAULT_REPOS } from './mockData';

export const STORAGE_KEYS = {
    REPOS: 'app-converter-repos',
    GLOBAL_DEFAULTS: 'app-converter-global-defaults'
};

export const GLOBAL_CONFIG_KEYS = [
    'password', 'storagePool', 'bridge', 'useDhcp', 
    'staticIp', 'gateway', 'cpuCores', 'ramSize', 'diskSize', 'ctId'
] as const;

export const DEFAULT_GLOBAL_SETTINGS = {
    password: process.env.DEFAULT_PASSWORD || 'password',
    ctId: Number(process.env.DEFAULT_CT_ID) || 105,
    storagePool: process.env.DEFAULT_STORAGE_POOL || 'local-lvm',
    bridge: process.env.DEFAULT_BRIDGE || 'vmbr0',
    useDhcp: process.env.DEFAULT_USE_DHCP !== 'false',
    staticIp: process.env.DEFAULT_STATIC_IP || '192.168.1.100/24',
    gateway: process.env.DEFAULT_GATEWAY || '',
    cpuCores: Number(process.env.DEFAULT_CPU_CORES) || 2,
    ramSize: Number(process.env.DEFAULT_RAM_SIZE) || 2048,
    diskSize: Number(process.env.DEFAULT_DISK_SIZE) || 8
};

export const loadReposFromStorage = (): Repo[] => {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.REPOS);
        return saved ? JSON.parse(saved) : DEFAULT_REPOS;
    } catch (e) {
        console.error("Failed to parse local storage", e);
        return DEFAULT_REPOS;
    }
};

export const loadDefaultsFromStorage = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.GLOBAL_DEFAULTS);
        return saved ? JSON.parse(saved) : DEFAULT_GLOBAL_SETTINGS;
    } catch (e) {
        return DEFAULT_GLOBAL_SETTINGS;
    }
};

export const saveReposToStorage = (repos: Repo[]) => {
    localStorage.setItem(STORAGE_KEYS.REPOS, JSON.stringify(repos));
};

export const saveDefaultsToStorage = (defaults: Partial<DeploymentConfig>) => {
    localStorage.setItem(STORAGE_KEYS.GLOBAL_DEFAULTS, JSON.stringify(defaults));
};
