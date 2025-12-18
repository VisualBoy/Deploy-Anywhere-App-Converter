import { AppDefinition } from '../types';
import { fetchRepoContents, getRawUrl, parseGitHubUrl } from './github';
import { parseCasaOSApp } from './appParser';

// Limit concurrent fetches to avoid overwhelming the browser/network
const CONCURRENT_LIMIT = 5;

/**
 * Fetches apps from a repository URL.
 * Handles:
 * - Direct JSON list (legacy)
 * - GitHub Repository scanning (CasaOS style)
 */
export const fetchAppsFromUrl = async (url: string): Promise<AppDefinition[]> => {
    // 1. Try to parse as GitHub URL
    const gitInfo = parseGitHubUrl(url);

    if (gitInfo) {
        return fetchGitHubApps(gitInfo.owner, gitInfo.repo, gitInfo.branch);
    }

    // 2. Fallback: Fetch as direct JSON
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
        // Try 'Apps' directory first (CasaOS standard)
        let appsPath = 'Apps';
        let contents;

        try {
            contents = await fetchRepoContents(owner, repo, appsPath);
        } catch (e) {
            // If Apps folder doesn't exist, try root (maybe Umbrel style, though we focus on CasaOS structure mostly)
            console.warn('Apps directory not found, trying root...');
            appsPath = '';
            contents = await fetchRepoContents(owner, repo, '');
        }

        // Filter for directories
        const appDirs = contents.filter(item => item.type === 'dir');

        if (appDirs.length === 0) {
            console.warn('No app directories found');
            return [];
        }

        const apps: AppDefinition[] = [];

        // Process in chunks to avoid rate limits / network congestion
        // Only process first 30 apps to avoid hitting rate limits in this demo context
        // In a real production app, we would paginate or use a different strategy.
        const dirsToProcess = appDirs.slice(0, 30);

        for (let i = 0; i < dirsToProcess.length; i += CONCURRENT_LIMIT) {
            const chunk = dirsToProcess.slice(i, i + CONCURRENT_LIMIT);

            const promises = chunk.map(async (dir) => {
                try {
                    // Try fetching docker-compose.yml
                    // Path in repo: Apps/appName/docker-compose.yml
                    const composePath = appsPath ? `${appsPath}/${dir.name}/docker-compose.yml` : `${dir.name}/docker-compose.yml`;
                    const rawUrl = getRawUrl(owner, repo, branch, composePath);

                    const res = await fetch(rawUrl);
                    if (!res.ok) return null;

                    const text = await res.text();

                    // Parse
                    return parseCasaOSApp(dir.name, text);
                } catch (e) {
                    console.warn(`Failed to fetch/parse app ${dir.name}`, e);
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
