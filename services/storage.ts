import { Repo, DeploymentConfig, TargetPlatform, AppDefinition } from '../types';
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

// --- IndexedDB Management ---
const DB_NAME = 'DeployAnywhereDB';
const STORE_NAME = 'repoApps';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

const getDB = (): Promise<IDBDatabase> => {
    if (typeof window === 'undefined') {
        return Promise.reject(new Error('IndexedDB is not available server-side'));
    }
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
        try {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = (e) => {
                const db = request.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        } catch (e) {
            reject(e);
        }
    });
    return dbPromise;
};

export const getRepoAppsFromIndexedDB = async (repoId: string): Promise<AppDefinition[]> => {
    try {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            try {
                const transaction = db.transaction(STORE_NAME, 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.get(repoId);
                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => reject(request.error);
            } catch (err) {
                reject(err);
            }
        });
    } catch (e) {
        console.error(`Failed to read from IndexedDB for repo ${repoId}`, e);
        return [];
    }
};

export const saveRepoAppsToIndexedDB = async (repoId: string, apps: AppDefinition[]): Promise<void> => {
    try {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            try {
                const transaction = db.transaction(STORE_NAME, 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.put(apps, repoId);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            } catch (err) {
                reject(err);
            }
        });
    } catch (e) {
        console.error(`Failed to write to IndexedDB for repo ${repoId}`, e);
    }
};

export const deleteRepoAppsFromIndexedDB = async (repoId: string): Promise<void> => {
    try {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            try {
                const transaction = db.transaction(STORE_NAME, 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.delete(repoId);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            } catch (err) {
                reject(err);
            }
        });
    } catch (e) {
        console.error(`Failed to delete from IndexedDB for repo ${repoId}`, e);
    }
};

// --- Local Storage Management ---
export const loadReposFromStorage = (): Repo[] => {
    try {
        if (typeof window === 'undefined') return DEFAULT_REPOS;
        const saved = localStorage.getItem(STORAGE_KEYS.REPOS);
        return saved ? JSON.parse(saved) : DEFAULT_REPOS;
    } catch (e) {
        console.error("Failed to parse local storage", e);
        return DEFAULT_REPOS;
    }
};

export const loadDefaultsFromStorage = () => {
    try {
        if (typeof window === 'undefined') return DEFAULT_GLOBAL_SETTINGS;
        const saved = localStorage.getItem(STORAGE_KEYS.GLOBAL_DEFAULTS);
        return saved ? JSON.parse(saved) : DEFAULT_GLOBAL_SETTINGS;
    } catch (e) {
        return DEFAULT_GLOBAL_SETTINGS;
    }
};

export const saveReposToStorage = (repos: Repo[]) => {
    try {
        if (typeof window === 'undefined') return;
        // Strip out the heavy "apps" payloads before committing to limit-prone localStorage
        const strippedRepos = repos.map(r => ({
            ...r,
            apps: []
        }));
        localStorage.setItem(STORAGE_KEYS.REPOS, JSON.stringify(strippedRepos));
    } catch (e) {
        console.error("Failed to write repositories to local storage:", e);
    }
};

export const saveDefaultsToStorage = (defaults: Partial<DeploymentConfig>) => {
    try {
        if (typeof window === 'undefined') return;
        localStorage.setItem(STORAGE_KEYS.GLOBAL_DEFAULTS, JSON.stringify(defaults));
    } catch (e) {
        console.error("Failed to write defaults to local storage:", e);
    }
};
