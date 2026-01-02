import { fetchRecursiveRepoTree } from './github';

let cachedScripts: string[] = [];

/**
 * Fetches the list of available installation scripts from the Proxmox VE Community Scripts repository.
 * Looks for files in the 'install/' directory ending with '-install.sh'.
 */
export const fetchCommunityScripts = async (): Promise<string[]> => {
    // Return cache if available to prevent rate limiting
    if (cachedScripts.length > 0) return cachedScripts;

    try {
        console.log("Fetching Community Scripts list...");
        const tree = await fetchRecursiveRepoTree('community-scripts', 'ProxmoxVE', 'main');
        
        const scripts = tree
            .filter(item => item.path.startsWith('install/') && item.path.endsWith('-install.sh'))
            .map(item => {
                // install/plex-install.sh -> plex
                const fileName = item.path.split('/').pop() || '';
                return fileName.replace('-install.sh', '');
            });
            
        cachedScripts = scripts;
        console.log(`Found ${scripts.length} community scripts.`);
        return scripts;
    } catch (e) {
        console.error("Failed to fetch community scripts:", e);
        // Fallback list of popular apps in case GitHub API fails
        return ['plex', 'homeassistant', 'gotify', 'uptime-kuma', 'adguard-home', 'pihole', 'vaultwarden', 'jellyfin', 'radarr', 'sonarr', 'prowlarr', 'lidarr', 'readarr'];
    }
};

/**
 * Normalizes an app name or image name for matching against community scripts.
 * e.g., "AdGuard Home" -> "adguardhome"
 */
export const normalizeName = (name: string): string => {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '');
};
