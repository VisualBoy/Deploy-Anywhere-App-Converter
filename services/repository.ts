import { AppDefinition } from '../types';
import { fetchRecursiveRepoTree, getRawUrl, parseGitHubUrl } from './github';
import { parseUmbrelApp, parseCombinedMetadata } from './appParser';

const CONCURRENT_LIMIT = 8;

export const fetchAppsFromUrl = async (url: string): Promise<AppDefinition[]> => {
    const gitInfo = parseGitHubUrl(url);

    if (gitInfo) {
        return fetchGitHubApps(gitInfo.owner, gitInfo.repo, gitInfo.branch);
    }

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch JSON');
        const data = await response.json();

        if (Array.isArray(data)) return data;
        if (data.apps && Array.isArray(data.apps)) return data.apps;

        throw new Error('Invalid JSON format');
    } catch (e) {
        console.error('Failed to fetch apps from URL', e);
        throw e;
    }
};

const fetchGitHubApps = async (owner: string, repo: string, branch: string = 'master'): Promise<AppDefinition[]> => {
    try {
        const tree = await fetchRecursiveRepoTree(owner, repo, branch);
        
        const folders: Record<string, { 
            compose?: string; 
            umbrel?: string; 
            config?: string; 
            icon?: string; 
            id: string; 
            folderPath: string 
        }> = {};

        tree.forEach(item => {
            const parts = item.path.split('/');
            if (parts.length < 2) return;
            
            const folderPath = parts.slice(0, -1).join('/');
            const fileName = parts[parts.length - 1].toLowerCase();
            const id = parts[parts.length - 2];

            if (!folders[folderPath]) {
                folders[folderPath] = { id, folderPath };
            }

            if (fileName === 'docker-compose.yml' || fileName === 'docker-compose.yaml') {
                folders[folderPath].compose = item.path;
            } else if (fileName === 'umbrel-app.yml' || fileName === 'umbrel-app.yaml') {
                folders[folderPath].umbrel = item.path;
            } else if (fileName === 'config.json') {
                folders[folderPath].config = item.path;
            } else if (fileName === 'icon.svg' || fileName === 'icon.png' || fileName === 'icon.jpg' || fileName === 'logo.png') {
                folders[folderPath].icon = item.path;
            }
        });

        const validFolders = Object.values(folders).filter(f => f.compose);
        const apps: AppDefinition[] = [];
        const folderList = validFolders.slice(0, 500);

        for (let i = 0; i < folderList.length; i += CONCURRENT_LIMIT) {
            const chunk = folderList.slice(i, i + CONCURRENT_LIMIT);

            const promises = chunk.map(async (folder) => {
                try {
                    const composeUrl = getRawUrl(owner, repo, branch, folder.compose!);
                    const composeRes = await fetch(composeUrl);
                    if (!composeRes.ok) return null;
                    const composeText = await composeRes.text();

                    const iconUrl = folder.icon ? getRawUrl(owner, repo, branch, folder.icon) : undefined;
                    const baseUrl = getRawUrl(owner, repo, branch, folder.folderPath);

                    // Try Umbrel Metadata first
                    if (folder.umbrel) {
                        const metaUrl = getRawUrl(owner, repo, branch, folder.umbrel);
                        const metaRes = await fetch(metaUrl);
                        if (metaRes.ok) {
                            const metaText = await metaRes.text();
                            const umbrelApp = parseUmbrelApp(metaText, composeText, iconUrl, baseUrl);
                            if (umbrelApp) return umbrelApp;
                        }
                    }

                    // Combined config.json + docker-compose metadata (BigBear style)
                    let configText: string | undefined;
                    if (folder.config) {
                        const configUrl = getRawUrl(owner, repo, branch, folder.config);
                        const configRes = await fetch(configUrl);
                        if (configRes.ok) configText = await configRes.text();
                    }

                    return parseCombinedMetadata(folder.id, composeText, configText, iconUrl);
                } catch (e) {
                    return null;
                }
            });

            const results = await Promise.all(promises);
            results.forEach(app => {
                if (app) apps.push(app);
            });
        }

        return apps;
    } catch (e) {
        console.error('GitHub fetch failed', e);
        throw e;
    }
};