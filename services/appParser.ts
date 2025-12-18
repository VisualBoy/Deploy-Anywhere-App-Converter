import yaml from 'js-yaml';
import { AppDefinition } from '../types';

interface CasaOSMetadata {
    main?: string;
    title?: { en_us: string };
    description?: { en_us: string };
    tagline?: { en_us: string };
    icon?: string;
    category?: string;
    port_map?: string;
    author?: string;
}

export const parseCasaOSApp = (id: string, composeContent: string): AppDefinition | null => {
    try {
        const parsed = yaml.load(composeContent) as any;

        if (!parsed) return null;

        // Extract x-casaos metadata
        const casaMetadata = parsed['x-casaos'] as CasaOSMetadata;

        // Also check if services have x-casaos (some older apps might)
        // But typically top-level x-casaos is what we want for the "App Store" display

        if (!casaMetadata) {
            // Fallback: Try to infer from services if possible, or just return basic info
            // For now, if no x-casaos, we might consider it invalid for "CasaOS" style parser
            return null;
        }

        const name = casaMetadata.title?.en_us || id;
        const description = casaMetadata.description?.en_us || '';
        const image = casaMetadata.icon || ''; // Default placeholder?
        const category = casaMetadata.category || 'Unknown';
        const port_map = casaMetadata.port_map || '';

        // Extract env vars from the main service
        const mainServiceName = casaMetadata.main;
        let env_vars: Record<string, string> = {};

        if (mainServiceName && parsed.services && parsed.services[mainServiceName]) {
            const service = parsed.services[mainServiceName];
            if (service.environment) {
                if (Array.isArray(service.environment)) {
                    service.environment.forEach((env: string) => {
                        const [key, val] = env.split('=');
                        if (key) env_vars[key] = val || '';
                    });
                } else if (typeof service.environment === 'object') {
                    env_vars = service.environment;
                }
            }
        }

        return {
            id,
            name,
            description,
            image,
            category,
            compose: composeContent,
            port_map,
            env_vars
        };

    } catch (e) {
        console.error(`Failed to parse app ${id}`, e);
        return null;
    }
};
