import yaml from 'js-yaml';
import { AppDefinition, CasaOSMetadata, UmbrelMetadata, ConfigJsonMetadata } from '../types';

/**
 * Translates the 'extract_metadata' logic from convert-apps.sh.
 * Merges data from config.json (BigBear style) and docker-compose.yml (CasaOS style).
 */
export const parseCombinedMetadata = (
    id: string, 
    composeContent: string, 
    configContent?: string, 
    iconUrl?: string
): AppDefinition | null => {
    try {
        const compose = yaml.load(composeContent) as any;
        const config = configContent ? JSON.parse(configContent) as ConfigJsonMetadata : null;
        
        if (!compose) return null;

        const xCasa = (compose['x-casaos'] || {}) as CasaOSMetadata;

        // Priority Logic from shell script:
        // ID: config.id -> folder name
        // Title: x-casaos.title -> config.title -> folder name
        const appId = config?.id || id;
        const appName = xCasa.title?.en_us || config?.name || config?.title || id;
        const description = xCasa.description?.en_us || config?.description || '';
        const tagline = xCasa.tagline?.en_us || config?.tagline || '';
        
        // Icon logic: x-casaos.icon -> config.icon -> iconUrl
        const image = xCasa.icon || config?.icon || iconUrl || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + appId;

        const mainService = xCasa.main || Object.keys(compose.services || {})[0];
        
        let env_vars: Record<string, string> = {};
        if (mainService && compose.services?.[mainService]) {
            const service = compose.services[mainService];
            if (service.environment) {
                if (Array.isArray(service.environment)) {
                    service.environment.forEach((env: string) => {
                        const parts = env.split('=');
                        if (parts.length >= 2) env_vars[parts[0]] = parts.slice(1).join('=');
                    });
                } else if (typeof service.environment === 'object') {
                    Object.assign(env_vars, service.environment);
                }
            }
        }

        return {
            id: appId,
            name: appName,
            description,
            tagline,
            image,
            thumbnail: xCasa.thumbnail || '',
            category: xCasa.category || config?.category || 'Utility',
            compose: composeContent,
            port_map: xCasa.port_map || config?.port?.toString() || '',
            env_vars,
            author: xCasa.author || config?.author || 'BigBearTechWorld',
            developer: xCasa.developer || config?.developer || '',
            version: config?.version || 'latest',
            screenshots: xCasa.screenshot_link || config?.screenshots || [],
            youtube: config?.youtube || '',
            docs_link: config?.docs_link || '',
            website: xCasa.index || xCasa.project_url || '',
            architectures: xCasa.architectures || ['amd64', 'arm64'],
            main_service: mainService
        };
    } catch (e) {
        console.error("Parser Error:", e);
        return null;
    }
};

/**
 * Legacy support for CasaOS-only repositories.
 */
export const parseCasaOSApp = (id: string, composeContent: string): AppDefinition | null => {
    return parseCombinedMetadata(id, composeContent);
};

/**
 * Parser for Umbrel-style apps (metadata in umbrel-app.yml).
 */
export const parseUmbrelApp = (metadataContent: string, composeContent: string, iconUrl?: string, baseUrl?: string): AppDefinition | null => {
    try {
        const meta = yaml.load(metadataContent) as UmbrelMetadata;
        if (!meta) return null;

        const screenshots = (meta.gallery || []).map(img => {
            if (img.startsWith('http')) return img;
            if (baseUrl) return `${baseUrl}/${img}`;
            return img;
        });

        return {
            id: meta.id || 'unknown',
            name: meta.name || meta.id,
            version: meta.version || 'latest',
            tagline: meta.tagline || '',
            description: meta.description || '',
            developer: meta.developer || '',
            website: meta.website || '',
            repo_link: meta.repo || '',
            support_link: meta.support || '',
            category: meta.category || 'Apps',
            port_map: meta.port ? meta.port.toString() : '',
            image: iconUrl || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + meta.id,
            compose: composeContent,
            env_vars: {},
            screenshots
        };
    } catch (e) {
        return null;
    }
};

/**
 * Parser for config.json style apps.
 */
export const parseConfigJsonApp = (configContent: string, composeContent: string, id: string, iconUrl?: string): AppDefinition | null => {
    return parseCombinedMetadata(id, composeContent, configContent, iconUrl);
};