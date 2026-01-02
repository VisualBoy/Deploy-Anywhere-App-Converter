import { useState, useEffect } from 'react';
import { AppDefinition, DeploymentConfig, TargetPlatform } from '../types';
import { generateProxmoxScript, generateStackFile } from '../services/scriptGenerator';
import { 
    DEFAULT_GLOBAL_SETTINGS, 
    GLOBAL_CONFIG_KEYS, 
    loadDefaultsFromStorage, 
    saveDefaultsToStorage 
} from '../services/storage';
import { fetchCommunityScripts, normalizeName } from '../services/community';
import yaml from 'js-yaml';

export const useDeploymentManager = () => {
    const [globalDefaults, setGlobalDefaults] = useState(loadDefaultsFromStorage);
    const [availableScripts, setAvailableScripts] = useState<string[]>([]);
    
    const [config, setConfig] = useState<DeploymentConfig>(() => ({
        ...DEFAULT_GLOBAL_SETTINGS,
        appId: '',
        appName: '',
        target: TargetPlatform.PROXMOX_LXC,
        hostPort: '8080',
        containerPort: '80',
        volumePath: './data',
        envVars: {},
        composeContent: '',
        mainImage: '',
        communityScript: undefined
    }));

    const [target, setTarget] = useState<TargetPlatform | null>(null);
    const [deploymentLog, setDeploymentLog] = useState<string[]>([]);
    const [deploying, setDeploying] = useState(false);
    const [deployed, setDeployed] = useState(false);

    // Load Community Scripts on Mount
    useEffect(() => {
        fetchCommunityScripts().then(setAvailableScripts);
    }, []);

    // Persist Global Defaults
    useEffect(() => {
        saveDefaultsToStorage(globalDefaults);
    }, [globalDefaults]);

    const updateConfig = (newConfig: DeploymentConfig | ((prev: DeploymentConfig) => DeploymentConfig)) => {
        setConfig(prev => {
            const next = typeof newConfig === 'function' ? newConfig(prev) : newConfig;
            
            // Check for global updates
            const updatedGlobals: any = {};
            let hasGlobalChange = false;
            GLOBAL_CONFIG_KEYS.forEach(key => {
                if (next[key] !== globalDefaults[key]) {
                    updatedGlobals[key] = next[key];
                    hasGlobalChange = true;
                }
            });
            
            if (hasGlobalChange) {
                setGlobalDefaults(prevG => ({ ...prevG, ...updatedGlobals }));
            }
            return next;
        });
    };

    const initializeConfigForApp = (app: AppDefinition) => {
        let hPort = '8080';
        let cPort = '80';
        let mainImage = '';
        
        // Port Extraction
        if(app.port_map) {
            const parts = app.port_map.split(':');
            if(parts.length === 2) {
                hPort = parts[0];
                cPort = parts[1];
            } else if (parts.length === 1 && parts[0]) {
                hPort = parts[0];
                cPort = parts[0];
            }
        }

        // Main Image Extraction
        try {
            const doc = yaml.load(app.compose) as any;
            if (doc && doc.services) {
                const serviceName = app.main_service || Object.keys(doc.services)[0];
                if (doc.services[serviceName]) {
                    mainImage = doc.services[serviceName].image || '';
                }
            }
        } catch (e) {
            console.warn("Failed to extract image from compose", e);
        }

        // --- Community Script Matching Logic ---
        let matchedScript: string | undefined = undefined;
        if (mainImage) {
            // Extract core name (e.g. linuxserver/plex -> plex)
            const imageName = mainImage.split('/').pop()?.split(':')[0] || '';
            const normalizedImage = normalizeName(imageName);
            const normalizedApp = normalizeName(app.name);

            // 1. Try exact image match (e.g. 'plex' -> 'plex')
            if (availableScripts.includes(imageName)) {
                matchedScript = imageName;
            } 
            // 2. Try normalized image match (e.g. 'adguardhome' -> 'adguard-home' fuzzy)
            else {
                const fuzzyMatch = availableScripts.find(s => normalizeName(s) === normalizedImage);
                if (fuzzyMatch) matchedScript = fuzzyMatch;
                else {
                     // 3. Try app name match (e.g. 'Home Assistant' -> 'homeassistant')
                    const nameMatch = availableScripts.find(s => normalizeName(s) === normalizedApp);
                    if (nameMatch) matchedScript = nameMatch;
                }
            }
        }
        
        setConfig({
            ...globalDefaults,
            appId: app.id,
            appName: app.name,
            target: target || config.target || TargetPlatform.PROXMOX_LXC,
            composeContent: app.compose,
            hostPort: hPort,
            containerPort: cPort,
            volumePath: app.volume_map || './data',
            envVars: app.env_vars || {},
            mainImage: mainImage,
            communityScript: matchedScript
        });
    };

    const handleTargetSelect = (t: TargetPlatform) => {
        setTarget(t);
        setConfig(prev => ({ ...prev, target: t }));
    };

    const startDeployment = () => {
        setDeploying(true);
        setDeployed(false);
        setDeploymentLog([]);
        
        const logs = [
            "Analyzing configuration...",
            `Target Platform: ${config.target}`,
            "Parsing Compose YAML...",
            "Applying environment overrides...",
            "Configuring network...",
            config.communityScript 
                ? `Matched Community Script: ${config.communityScript}` 
                : "No Community Script matched. Using Docker fallback.",
            "Generating script...",
            "Done."
        ];

        let i = 0;
        const interval = setInterval(() => {
            if (i >= logs.length) {
                clearInterval(interval);
                setDeploying(false);
                setDeployed(true);
                return;
            }
            setDeploymentLog(prev => [...prev, logs[i]]);
            i++;
        }, 600);
    };

    const downloadScript = () => {
        let content = '';
        let filename = '';

        if (config.target === TargetPlatform.PROXMOX_LXC) {
            content = generateProxmoxScript(config);
            filename = `install-${config.appId}.sh`;
        } else {
            content = generateStackFile(config);
            filename = 'docker-compose.yml';
        }

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return {
        config,
        target,
        globalDefaults,
        deploymentLog,
        deploying,
        deployed,
        updateConfig,
        initializeConfigForApp,
        handleTargetSelect,
        startDeployment,
        downloadScript,
        setDeployed,
        setDeploying,
        setDeploymentLog
    };
};