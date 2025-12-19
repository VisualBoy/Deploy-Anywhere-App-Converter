import React, { useState, useEffect, useCallback } from 'react';
import { StepWizard } from './components/StepWizard';
import { AppLibrary } from './components/AppLibrary';
import { YamlInput } from './components/YamlInput';
import { SettingsPanel } from './components/SettingsPanel';
import { AppDetailsModal } from './components/AppDetailsModal';
import { TargetSelector } from './components/TargetSelector';
import { Configurator } from './components/Configurator';
import { DeploymentResult } from './components/DeploymentResult';
import { AppDefinition, DeploymentConfig, TargetPlatform, Repo } from './types';
import { REPOSITORIES as DEFAULT_REPOS } from './services/mockData';
import { generateProxmoxScript, generateStackFile } from './services/scriptGenerator';
import { fetchAppsFromUrl } from './services/repository';
import { Settings, ArrowRight } from 'lucide-react';

const STORAGE_KEYS = {
    REPOS: 'app-converter-repos',
    GLOBAL_DEFAULTS: 'app-converter-global-defaults'
};

const CACHE_VALIDITY_MS = 24 * 60 * 60 * 1000; // 24 hours

const GLOBAL_CONFIG_KEYS = [
    'password', 'storagePool', 'bridge', 'useDhcp', 
    'staticIp', 'gateway', 'cpuCores', 'ramSize', 'diskSize', 'ctId'
] as const;

const DEFAULT_GLOBAL_SETTINGS = {
    password: 'password',
    ctId: 105,
    storagePool: 'local-lvm',
    bridge: 'vmbr0',
    useDhcp: true,
    staticIp: '192.168.1.100/24',
    gateway: '',
    cpuCores: 2,
    ramSize: 2048,
    diskSize: 8
};

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedApp, setSelectedApp] = useState<AppDefinition | null>(null);
  const [isManualInput, setIsManualInput] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [target, setTarget] = useState<TargetPlatform | null>(null);
  
  const [repositories, setRepositories] = useState<Repo[]>(() => {
      const saved = localStorage.getItem(STORAGE_KEYS.REPOS);
      return saved ? JSON.parse(saved) : DEFAULT_REPOS;
  });

  const [globalDefaults, setGlobalDefaults] = useState(() => {
      const saved = localStorage.getItem(STORAGE_KEYS.GLOBAL_DEFAULTS);
      return saved ? JSON.parse(saved) : DEFAULT_GLOBAL_SETTINGS;
  });
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSyncingGlobal, setIsSyncingGlobal] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');

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

  useEffect(() => {
      localStorage.setItem(STORAGE_KEYS.REPOS, JSON.stringify(repositories));
  }, [repositories]);

  useEffect(() => {
      localStorage.setItem(STORAGE_KEYS.GLOBAL_DEFAULTS, JSON.stringify(globalDefaults));
  }, [globalDefaults]);

  // Handle Sync Logic
  const handleSyncRepos = useCallback(async (force: boolean = false) => {
      setIsSyncingGlobal(true);
      const now = Date.now();
      try {
          const updatedRepos: Repo[] = [];
          for (const repo of repositories) {
              if (!repo.url) {
                  updatedRepos.push(repo);
                  continue;
              }
              
              const isExpired = !repo.lastSynced || (now - repo.lastSynced > CACHE_VALIDITY_MS);
              if (!force && !isExpired && repo.apps.length > 0) {
                  updatedRepos.push(repo);
                  continue;
              }

              setSyncStatus(`Syncing ${repo.name}...`);
              try {
                  const apps = await fetchAppsFromUrl(repo.url);
                  updatedRepos.push({ ...repo, apps, lastSynced: now });
              } catch (e) {
                  console.warn(`Failed to sync repo ${repo.name}:`, e);
                  updatedRepos.push(repo);
              }
          }
          setRepositories(updatedRepos);
          setSyncStatus('Sync complete!');
          setTimeout(() => setSyncStatus(''), 3000);
      } finally {
          setIsSyncingGlobal(false);
      }
  }, [repositories]);

  // Auto-sync on mount if needed
  useEffect(() => {
      const needsSync = repositories.some(r => r.url && (!r.lastSynced || Date.now() - r.lastSynced > CACHE_VALIDITY_MS));
      if (needsSync) {
          handleSyncRepos(false);
      }
  }, []);

  const updateConfig = (newConfig: DeploymentConfig | ((prev: DeploymentConfig) => DeploymentConfig)) => {
      setConfig(prev => {
          const next = typeof newConfig === 'function' ? newConfig(prev) : newConfig;
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

  const [deploymentLog, setDeploymentLog] = useState<string[]>([]);
  const [deploying, setDeploying] = useState(false);
  const [deployed, setDeployed] = useState(false);

  const handleAddRepo = async (name: string, url: string) => {
      setIsSyncingGlobal(true);
      setSyncStatus(`Adding ${name}...`);
      try {
          const apps = await fetchAppsFromUrl(url);
          const newRepo: Repo = {
              id: `custom-${Date.now()}`,
              name: name,
              url: url,
              apps: apps,
              lastSynced: Date.now()
          };
          setRepositories(prev => [...prev, newRepo]);
          setSyncStatus('Repository added!');
          setTimeout(() => setSyncStatus(''), 2000);
      } catch (error) {
          console.error("Error adding repository:", error);
          setSyncStatus('Add failed');
          alert(`Failed to fetch apps from repository. Please check the URL.\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
          setIsSyncingGlobal(false);
      }
  };

  const handleRemoveRepo = (id: string) => {
      setRepositories(prev => prev.filter(r => r.id !== id));
  };

  const handleAppSelect = (app: AppDefinition) => {
    setSelectedApp(app);
    setIsDetailsModalOpen(true);
  };

  const handleProceedToConvert = () => {
    if (!selectedApp) return;
    setIsDetailsModalOpen(false);

    let hPort = '8080';
    let cPort = '80';
    
    if(selectedApp.port_map) {
        const parts = selectedApp.port_map.split(':');
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
        appId: selectedApp.id,
        appName: selectedApp.name,
        target: target || config.target || TargetPlatform.PROXMOX_LXC,
        composeContent: selectedApp.compose,
        hostPort: hPort,
        containerPort: cPort,
        volumePath: selectedApp.volume_map || './data',
        envVars: selectedApp.env_vars || {}
    });
    
    setCurrentStep(2);
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

  const renderContent = () => {
      if (isManualInput) {
          return (
            <YamlInput 
                onBack={() => setIsManualInput(false)} 
                onNext={(app) => { setIsManualInput(false); setSelectedApp(app); setIsDetailsModalOpen(true); }} 
            />
          );
      }

      switch(currentStep) {
          case 1:
              return (
                  <AppLibrary 
                    repositories={repositories}
                    onSelectApp={handleAppSelect} 
                    onManualYaml={() => setIsManualInput(true)} 
                    onSync={() => handleSyncRepos(true)}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                    isSyncing={isSyncingGlobal}
                    syncStatus={syncStatus}
                  />
              );
          
          case 2:
              return (
                  <TargetSelector 
                    selectedApp={selectedApp} 
                    target={target || config.target} 
                    onTargetSelect={handleTargetSelect} 
                    onBack={() => setCurrentStep(1)} 
                    onNext={() => setCurrentStep(3)} 
                  />
              );

          case 3:
              return (
                <Configurator 
                    selectedApp={selectedApp}
                    config={config}
                    setConfig={updateConfig}
                    onBack={() => setCurrentStep(2)}
                    onGenerate={() => { setCurrentStep(4); startDeployment(); }}
                />
              );

          case 4:
              return (
                  <DeploymentResult 
                    deployed={deployed}
                    deploying={deploying}
                    deploymentLog={deploymentLog}
                    config={config}
                    onStartOver={() => setCurrentStep(1)}
                    onDownload={downloadScript}
                  />
              );
          default:
              return null;
      }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-900 text-slate-200">
        <nav className="bg-slate-950 border-b border-slate-800 h-16 flex items-center justify-between px-6 shrink-0 z-50 shadow-md">
            <div className="flex items-center gap-4">
                <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center text-white shadow-lg"><ArrowRight className="w-6 h-6 rotate-45" /></div>
                <div><h1 className="text-lg font-bold text-white">App Converter</h1><p className="text-[10px] text-orange-500 font-bold uppercase">Deploy Anywhere</p></div>
            </div>
            <button onClick={() => setIsSettingsOpen(true)} className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center hover:bg-slate-700 transition-colors cursor-pointer"><Settings className="w-4 h-4 text-slate-400" /></button>
        </nav>
        
        <SettingsPanel 
            isOpen={isSettingsOpen} 
            onClose={() => setIsSettingsOpen(false)} 
            repositories={repositories} 
            onAddRepo={handleAddRepo} 
            onRemoveRepo={handleRemoveRepo} 
            onSync={() => handleSyncRepos(true)} 
            isSyncingExternal={isSyncingGlobal} 
            syncStatus={syncStatus}
        />

        <AppDetailsModal 
            app={selectedApp} 
            isOpen={isDetailsModalOpen} 
            onClose={() => setIsDetailsModalOpen(false)} 
            onConvert={handleProceedToConvert} 
        />

        {!isManualInput && <StepWizard currentStep={currentStep} setStep={setCurrentStep} />}
        
        <main className="flex-grow flex flex-col relative overflow-hidden">{renderContent()}</main>
    </div>
  );
}

export default App;