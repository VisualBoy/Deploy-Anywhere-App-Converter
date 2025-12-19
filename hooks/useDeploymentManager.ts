import { useState, useEffect } from 'react';
import { AppDefinition, DeploymentConfig, TargetPlatform } from '../types';
import { generateProxmoxScript, generateStackFile } from '../services/scriptGenerator';
import { 
    DEFAULT_GLOBAL_SETTINGS, 
    GLOBAL_CONFIG_KEYS, 
    loadDefaultsFromStorage, 
    saveDefaultsToStorage 
} from '../services/storage';

export const useDeploymentManager = () => {
    const [globalDefaults, setGlobalDefaults] = useState(loadDefaultsFromStorage);
    
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
    }));

    const [target, setTarget] = useState<TargetPlatform | null>(null);
    const [deploymentLog, setDeploymentLog] = useState<string[]>([]);
    const [deploying, setDeploying] = useState(false);
    const [deployed, setDeployed] = useState(false);

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

        setConfig({
            ...globalDefaults,
            appId: app.id,
            appName: app.name,
            target: target || config.target || TargetPlatform.PROXMOX_LXC,
            composeContent: app.compose,
            hostPort: hPort,
            containerPort: cPort,
            volumePath: app.volume_map || './data',
            envVars: app.env_vars || {}
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
