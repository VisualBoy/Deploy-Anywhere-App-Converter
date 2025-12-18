import React, { useState, useEffect } from 'react';
import { StepWizard } from './components/StepWizard';
import { AppLibrary } from './components/AppLibrary';
import { YamlInput } from './components/YamlInput';
import { SettingsPanel } from './components/SettingsPanel';
import { AppDefinition, DeploymentConfig, TargetPlatform, Repo } from './types';
import { REPOSITORIES as DEFAULT_REPOS } from './services/mockData';
import { fetchAppsFromUrl } from './services/repository';
import { generateProxmoxScript, generateStackFile } from './services/scriptGenerator';
import { 
    Settings, Download, HardDrive, Server, Cpu,
    ArrowRight, ArrowLeft, Rocket, Check, 
    Terminal, Box, ChevronDown, ChevronUp, Variable,
    Lock, Network, Key
} from 'lucide-react';

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedApp, setSelectedApp] = useState<AppDefinition | null>(null);
  const [isManualInput, setIsManualInput] = useState(false);
  const [target, setTarget] = useState<TargetPlatform | null>(null);
  
  // Repository Management State
  const [repositories, setRepositories] = useState<Repo[]>(DEFAULT_REPOS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Accordion State
  const [activeAccordion, setActiveAccordion] = useState<'general' | 'resources' | 'network' | 'env'>('general');

  // Configuration State
  const [config, setConfig] = useState<DeploymentConfig>({
      appId: '',
      appName: '',
      target: TargetPlatform.PROXMOX_LXC,
      // LXC Defaults
      password: 'password',
      storagePool: 'local-lvm',
      // Network Defaults
      hostPort: '8080',
      containerPort: '80',
      bridge: 'vmbr0',
      useDhcp: true,
      staticIp: '192.168.1.100/24',
      gateway: '',
      // App Defaults
      volumePath: './data',
      envVars: {},
      composeContent: '',
      // Resource Defaults
      cpuCores: 2,
      ramSize: 2048,
      diskSize: 8
  });

  const [deploymentLog, setDeploymentLog] = useState<string[]>([]);
  const [deploying, setDeploying] = useState(false);
  const [deployed, setDeployed] = useState(false);

  // Reset accordion when entering step 3
  useEffect(() => {
    if (currentStep === 3) {
        setActiveAccordion('general');
    }
  }, [currentStep]);

  // Handle Repository Actions
  const handleAddRepo = async (name: string, url: string) => {
      try {
          const fetchedApps = await fetchAppsFromUrl(url);

          if (fetchedApps.length === 0) {
              alert('No apps found in this repository. Ensure it follows CasaOS structure (Apps/ folder with docker-compose.yml files).');
              return;
          }

          const newRepo: Repo = {
              id: `custom-${Date.now()}`,
              name: name,
              url: url,
              apps: fetchedApps
          };
          setRepositories(prev => [...prev, newRepo]);
      } catch (error) {
          console.error(error);
          alert('Failed to fetch repository. Check URL and try again. (GitHub API rate limits may apply)');
      }
  };

  const handleRemoveRepo = (id: string) => {
      setRepositories(prev => prev.filter(r => r.id !== id));
  };

  const handleSyncRepos = () => {
      // In a real application, this would re-fetch JSON from URLs
      console.log("Syncing repositories...");
      // For demo, just refresh the list logic implies "success" via the settings panel spinner
  };

  // Handle App Selection
  const handleAppSelect = (app: AppDefinition) => {
    setSelectedApp(app);
    // Parse ports roughly from default if available
    let hPort = '8080';
    let cPort = '80';
    if(app.port_map) {
        const parts = app.port_map.split(':');
        if(parts.length === 2) {
            hPort = parts[0];
            cPort = parts[1];
        }
    }

    setConfig(prev => ({
        ...prev,
        appId: app.id,
        appName: app.name,
        composeContent: app.compose,
        hostPort: hPort,
        containerPort: cPort,
        volumePath: app.volume_map || './data',
        envVars: app.env_vars || {}
    }));
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
    
    // Simulate generation logs
    const logs = [
        "Analyzing configuration...",
        `Target Platform: ${config.target}`,
        "Parsing Compose YAML...",
        "Identifying volumes and mount points...",
        "Applying environment variable overrides...",
        "Configuring network interface...",
        "Building Proxmox installation script...",
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

  // Helper for rendering Env Vars
  const renderEnvVars = () => {
    const keys = Object.keys(config.envVars);
    if (keys.length === 0) {
        return <div className="text-slate-500 text-sm italic">No environment variables detected in the YAML.</div>;
    }
    return (
        <div className="space-y-3">
            {keys.map((key) => (
                <div key={key} className="grid grid-cols-3 gap-4 items-center">
                    <div className="col-span-1 text-xs font-bold text-slate-400 break-all">{key}</div>
                    <div className="col-span-2">
                        <input 
                            type="text" 
                            value={config.envVars[key]} 
                            onChange={(e) => {
                                const newEnv = {...config.envVars, [key]: e.target.value};
                                setConfig({...config, envVars: newEnv});
                            }}
                            className="w-full bg-slate-900 border border-slate-600 text-white p-2 text-xs rounded focus:border-orange-500 focus:outline-none"
                        />
                    </div>
                </div>
            ))}
        </div>
    );
  };

  // Render Logic based on Step
  const renderContent = () => {
      if (isManualInput) {
          return <YamlInput onBack={() => setIsManualInput(false)} onNext={(app) => { setIsManualInput(false); handleAppSelect(app); }} />;
      }

      switch(currentStep) {
          case 1:
              return (
                  <AppLibrary 
                    repositories={repositories}
                    onSelectApp={handleAppSelect} 
                    onManualYaml={() => setIsManualInput(true)} 
                  />
              );
          
          case 2:
              return (
                  <div className="flex-grow flex flex-col items-center justify-start md:justify-center p-4 md:p-8 bg-slate-800/50 animate-fade-in overflow-y-auto pb-24 md:pb-8 w-full">
                      <div className="max-w-3xl w-full">
                          <div className="text-center mb-6 md:mb-10 mt-4 md:mt-0">
                              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Select Target</h2>
                              <p className="text-sm md:text-base text-slate-400">Where do you want to deploy {selectedApp?.name}?</p>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                              <div 
                                onClick={() => handleTargetSelect(TargetPlatform.PROXMOX_LXC)}
                                className={`cursor-pointer bg-slate-800 border-2 rounded-xl p-6 transition-all shadow-lg group relative ${target === TargetPlatform.PROXMOX_LXC ? 'border-orange-500 bg-slate-750' : 'border-slate-700 hover:border-orange-500/50'}`}
                              >
                                  <div className="absolute top-4 right-4 text-orange-500">
                                      {target === TargetPlatform.PROXMOX_LXC && <Check />}
                                  </div>
                                  <Server className={`w-12 h-12 mb-4 ${target === TargetPlatform.PROXMOX_LXC ? 'text-white' : 'text-slate-500'}`} />
                                  <h3 className="text-lg font-bold text-white mb-1">Proxmox LXC</h3>
                                  <p className="text-sm text-slate-400">Generates a host-side Bash script to create an LXC, install Docker, and deploy the app (Auto-Pilot).</p>
                              </div>

                              <div 
                                onClick={() => handleTargetSelect(TargetPlatform.PORTAINER)}
                                className={`cursor-pointer bg-slate-800 border-2 rounded-xl p-6 transition-all shadow-lg group relative ${target === TargetPlatform.PORTAINER ? 'border-orange-500 bg-slate-750' : 'border-slate-700 hover:border-orange-500/50'}`}
                              >
                                  <div className="absolute top-4 right-4 text-orange-500">
                                      {target === TargetPlatform.PORTAINER && <Check />}
                                  </div>
                                  <Box className={`w-12 h-12 mb-4 ${target === TargetPlatform.PORTAINER ? 'text-white' : 'text-slate-500'}`} />
                                  <h3 className="text-lg font-bold text-white mb-1">Portainer / Dockge</h3>
                                  <p className="text-sm text-slate-400">Cleaned Docker Compose output suitable for Portainer Stacks or Dockge.</p>
                              </div>
                          </div>

                          <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900 border-t border-slate-800 flex justify-between items-center z-40 md:static md:bg-transparent md:border-0 md:p-0 md:mt-12">
                              <button onClick={() => setCurrentStep(1)} className="px-6 py-3 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 font-medium transition-colors flex items-center text-sm md:text-base">
                                  <ArrowLeft className="w-5 h-5 mr-2" /> Back
                              </button>
                              <button 
                                onClick={() => setCurrentStep(3)} 
                                disabled={!target}
                                className="bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 md:px-8 py-3 rounded-lg font-bold shadow-lg shadow-orange-600/30 transition-all flex items-center text-sm md:text-base"
                              >
                                  Configure <ArrowRight className="w-5 h-5 ml-2" />
                              </button>
                          </div>
                      </div>
                  </div>
              );

          case 3:
              return (
                <div className="flex-grow p-6 md:p-10 bg-slate-800/50 overflow-y-auto">
                    <div className="max-w-5xl mx-auto h-full flex flex-col">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-white rounded-lg p-1 flex items-center justify-center">
                                <img src={selectedApp?.image} alt="icon" className="max-w-full max-h-full" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Configure {selectedApp?.name}</h2>
                                <p className="text-sm text-slate-400">Customize deployment settings</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-grow items-start">
                            {/* Left Column: Accordions */}
                            <div className="lg:col-span-2 space-y-4">
                                
                                {/* 1. LXC General */}
                                <div className={`bg-slate-900 border ${activeAccordion === 'general' ? 'border-orange-500/50' : 'border-slate-700'} rounded-xl transition-all duration-300 overflow-hidden shadow-xl`}>
                                    <button 
                                        onClick={() => setActiveAccordion('general')}
                                        className={`w-full flex items-center justify-between p-6 ${activeAccordion === 'general' ? 'bg-slate-800' : 'bg-slate-900 hover:bg-slate-800'} transition-colors`}
                                    >
                                        <h3 className={`text-lg font-medium flex items-center gap-3 ${activeAccordion === 'general' ? 'text-white' : 'text-slate-400'}`}>
                                           <Key className={`w-5 h-5 ${activeAccordion === 'general' ? 'text-orange-500' : 'text-slate-500'}`} />
                                           General & Credentials
                                        </h3>
                                        {activeAccordion === 'general' ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                                    </button>
                                    
                                    {activeAccordion === 'general' && (
                                        <div className="p-6 border-t border-slate-800 bg-slate-800/30">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">LXC Hostname</label>
                                                    <input 
                                                        type="text" 
                                                        value={config.appId}
                                                        onChange={(e) => setConfig({...config, appId: e.target.value})}
                                                        className="w-full bg-slate-900 border border-slate-600 text-white p-3 rounded-lg focus:border-orange-500 focus:outline-none transition-colors" 
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Root Password</label>
                                                    <input 
                                                        type="password" 
                                                        value={config.password}
                                                        onChange={(e) => setConfig({...config, password: e.target.value})}
                                                        className="w-full bg-slate-900 border border-slate-600 text-white p-3 rounded-lg focus:border-orange-500 focus:outline-none transition-colors" 
                                                    />
                                                </div>
                                            </div>
                                            
                                            <div className="flex justify-end pt-4 border-t border-slate-700/50">
                                                <button 
                                                    onClick={() => setActiveAccordion('resources')}
                                                    className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-lg transition-all flex items-center gap-2"
                                                >
                                                    Next <ArrowRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* 2. Resources */}
                                <div className={`bg-slate-900 border ${activeAccordion === 'resources' ? 'border-orange-500/50' : 'border-slate-700'} rounded-xl transition-all duration-300 overflow-hidden shadow-xl`}>
                                    <button 
                                        onClick={() => setActiveAccordion('resources')}
                                        className={`w-full flex items-center justify-between p-6 ${activeAccordion === 'resources' ? 'bg-slate-800' : 'bg-slate-900 hover:bg-slate-800'} transition-colors`}
                                    >
                                        <h3 className={`text-lg font-medium flex items-center gap-3 ${activeAccordion === 'resources' ? 'text-white' : 'text-slate-400'}`}>
                                           <Cpu className={`w-5 h-5 ${activeAccordion === 'resources' ? 'text-orange-500' : 'text-slate-500'}`} />
                                           Resources & Storage
                                        </h3>
                                        {activeAccordion === 'resources' ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                                    </button>
                                    
                                    {activeAccordion === 'resources' && (
                                        <div className="p-6 border-t border-slate-800 bg-slate-800/30">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Storage Pool ID</label>
                                                    <input 
                                                        type="text" 
                                                        value={config.storagePool}
                                                        onChange={(e) => setConfig({...config, storagePool: e.target.value})}
                                                        placeholder="local-lvm"
                                                        className="w-full bg-slate-900 border border-slate-600 text-white p-3 rounded-lg focus:border-orange-500 focus:outline-none transition-colors" 
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Disk Size (GB)</label>
                                                    <input 
                                                        type="number" 
                                                        value={config.diskSize}
                                                        onChange={(e) => setConfig({...config, diskSize: parseInt(e.target.value) || 4})}
                                                        className="w-full bg-slate-900 border border-slate-600 text-white p-3 rounded-lg focus:border-orange-500 focus:outline-none transition-colors" 
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">CPU Cores</label>
                                                    <input 
                                                        type="number" 
                                                        value={config.cpuCores}
                                                        onChange={(e) => setConfig({...config, cpuCores: parseInt(e.target.value) || 1})}
                                                        className="w-full bg-slate-900 border border-slate-600 text-white p-3 rounded-lg focus:border-orange-500 focus:outline-none transition-colors" 
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">RAM (MB)</label>
                                                    <input 
                                                        type="number" 
                                                        value={config.ramSize}
                                                        onChange={(e) => setConfig({...config, ramSize: parseInt(e.target.value) || 1024})}
                                                        className="w-full bg-slate-900 border border-slate-600 text-white p-3 rounded-lg focus:border-orange-500 focus:outline-none transition-colors" 
                                                    />
                                                </div>
                                            </div>
                                            
                                            <div className="flex justify-between pt-4 border-t border-slate-700/50">
                                                <button onClick={() => setActiveAccordion('general')} className="text-xs font-bold text-slate-500 hover:text-white flex items-center gap-1"><ArrowLeft className="w-3 h-3"/> Back</button>
                                                <button onClick={() => setActiveAccordion('network')} className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-lg transition-all flex items-center gap-2">Next <ArrowRight className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* 3. Network */}
                                <div className={`bg-slate-900 border ${activeAccordion === 'network' ? 'border-orange-500/50' : 'border-slate-700'} rounded-xl transition-all duration-300 overflow-hidden shadow-xl`}>
                                    <button 
                                        onClick={() => setActiveAccordion('network')}
                                        className={`w-full flex items-center justify-between p-6 ${activeAccordion === 'network' ? 'bg-slate-800' : 'bg-slate-900 hover:bg-slate-800'} transition-colors`}
                                    >
                                        <h3 className={`text-lg font-medium flex items-center gap-3 ${activeAccordion === 'network' ? 'text-white' : 'text-slate-400'}`}>
                                           <Network className={`w-5 h-5 ${activeAccordion === 'network' ? 'text-orange-500' : 'text-slate-500'}`} />
                                           Network Configuration
                                        </h3>
                                        {activeAccordion === 'network' ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                                    </button>
                                    
                                    {activeAccordion === 'network' && (
                                        <div className="p-6 border-t border-slate-800 bg-slate-800/30">
                                            <div className="grid grid-cols-2 gap-6 mb-6">
                                                 <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Bridge</label>
                                                    <input 
                                                        type="text" 
                                                        value={config.bridge}
                                                        onChange={(e) => setConfig({...config, bridge: e.target.value})}
                                                        placeholder="vmbr0"
                                                        className="w-full bg-slate-900 border border-slate-600 text-white p-3 rounded-lg focus:border-orange-500 focus:outline-none transition-colors" 
                                                    />
                                                </div>
                                                <div className="flex items-center">
                                                    <label className="flex items-center cursor-pointer mt-6">
                                                        <div className="relative">
                                                            <input type="checkbox" className="sr-only" checked={!config.useDhcp} onChange={() => setConfig({...config, useDhcp: !config.useDhcp})} />
                                                            <div className={`block w-14 h-8 rounded-full transition-colors ${!config.useDhcp ? 'bg-orange-600' : 'bg-slate-700'}`}></div>
                                                            <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${!config.useDhcp ? 'transform translate-x-6' : ''}`}></div>
                                                        </div>
                                                        <div className="ml-3 text-sm font-medium text-slate-300">
                                                            {config.useDhcp ? 'Using DHCP' : 'Static IP'}
                                                        </div>
                                                    </label>
                                                </div>
                                            </div>

                                            {!config.useDhcp && (
                                                <div className="grid grid-cols-2 gap-6 mb-6 animate-fade-in">
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">IPv4/CIDR</label>
                                                        <input 
                                                            type="text" 
                                                            value={config.staticIp}
                                                            onChange={(e) => setConfig({...config, staticIp: e.target.value})}
                                                            placeholder="192.168.1.50/24"
                                                            className="w-full bg-slate-900 border border-slate-600 text-white p-3 rounded-lg focus:border-orange-500 focus:outline-none transition-colors" 
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Gateway</label>
                                                        <input 
                                                            type="text" 
                                                            value={config.gateway}
                                                            onChange={(e) => setConfig({...config, gateway: e.target.value})}
                                                            placeholder="192.168.1.1"
                                                            className="w-full bg-slate-900 border border-slate-600 text-white p-3 rounded-lg focus:border-orange-500 focus:outline-none transition-colors" 
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            
                                            <div className="flex justify-between pt-4 border-t border-slate-700/50">
                                                <button onClick={() => setActiveAccordion('resources')} className="text-xs font-bold text-slate-500 hover:text-white flex items-center gap-1"><ArrowLeft className="w-3 h-3"/> Back</button>
                                                <button onClick={() => setActiveAccordion('env')} className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-lg transition-all flex items-center gap-2">Next <ArrowRight className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* 4. Environment / App Config */}
                                <div className={`bg-slate-900 border ${activeAccordion === 'env' ? 'border-orange-500/50' : 'border-slate-700'} rounded-xl transition-all duration-300 overflow-hidden shadow-xl`}>
                                    <button 
                                        onClick={() => setActiveAccordion('env')}
                                        className={`w-full flex items-center justify-between p-6 ${activeAccordion === 'env' ? 'bg-slate-800' : 'bg-slate-900 hover:bg-slate-800'} transition-colors`}
                                    >
                                        <h3 className={`text-lg font-medium flex items-center gap-3 ${activeAccordion === 'env' ? 'text-white' : 'text-slate-400'}`}>
                                           <Variable className={`w-5 h-5 ${activeAccordion === 'env' ? 'text-orange-500' : 'text-slate-500'}`} />
                                           App Configuration
                                        </h3>
                                        {activeAccordion === 'env' ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                                    </button>
                                    
                                    {activeAccordion === 'env' && (
                                        <div className="p-6 border-t border-slate-800 bg-slate-800/30">
                                            <div className="mb-8 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                               {renderEnvVars()}
                                            </div>
                                            
                                            <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                                                <button 
                                                    onClick={() => setActiveAccordion('network')}
                                                    className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
                                                >
                                                    <ArrowLeft className="w-3 h-3" /> Back
                                                </button>
                                                
                                                <button 
                                                    onClick={() => {
                                                        setCurrentStep(4);
                                                        startDeployment();
                                                    }} 
                                                    className="bg-gradient-to-r from-orange-600 to-red-500 hover:from-orange-500 hover:to-red-400 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-lg shadow-orange-900/20 transition-all flex items-center gap-2"
                                                >
                                                    <Rocket className="w-4 h-4" /> Generate
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                            </div>

                            {/* Right Column: Tips & Preview */}
                            <div className="space-y-6">
                                <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-6">
                                    <h4 className="text-orange-400 font-bold mb-2 flex items-center gap-2">
                                        Tip
                                    </h4>
                                    <p className="text-sm text-slate-300 leading-relaxed">
                                        {config.target === TargetPlatform.PROXMOX_LXC 
                                            ? "For Proxmox LXC, the generated script will mimic the wizard: setting up storage, network, and resources automatically. Just run it on the host."
                                            : "Standard Docker Compose format. Suitable for Dockge stacks or Portainer."}
                                    </p>
                                </div>

                                <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-xl">
                                    <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                                        <Terminal className="w-5 h-5 text-blue-500" /> Raw Compose Preview
                                    </h3>
                                    <textarea 
                                        className="w-full h-80 bg-slate-950 text-xs font-mono text-green-400 p-4 rounded-lg border border-slate-800 focus:outline-none resize-none"
                                        value={config.composeContent}
                                        readOnly
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
              );

          case 4:
              return (
                  <div className="flex-grow flex flex-col items-center justify-center p-8 bg-slate-900">
                      <div className="max-w-2xl w-full text-center">
                          {!deployed ? (
                              <div className="animate-fade-in">
                                  <div className="mb-8">
                                      <div className="w-16 h-16 bg-slate-800 rounded-xl mx-auto mb-4 p-2 animate-bounce">
                                          <img src={selectedApp?.image} className="w-full h-full object-contain" />
                                      </div>
                                      <h2 className="text-2xl font-bold text-white animate-pulse">Generating Artifacts...</h2>
                                  </div>
                                  
                                  <div className="bg-black/50 rounded-lg border border-slate-700 p-4 font-mono text-left h-64 overflow-hidden flex flex-col shadow-2xl relative">
                                      <div className="flex items-center gap-1.5 mb-4 border-b border-slate-800 pb-2">
                                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                          <span className="ml-2 text-xs text-slate-500">system@converter:~</span>
                                      </div>
                                      <div className="text-xs md:text-sm text-green-400 space-y-1 overflow-y-auto flex-grow scroll-smooth">
                                          {deploymentLog.map((log, i) => (
                                              <div key={i}><span className="opacity-50 mr-2">[{new Date().toLocaleTimeString()}]</span> {log}</div>
                                          ))}
                                      </div>
                                  </div>
                              </div>
                          ) : (
                              <div className="animate-fade-in">
                                  <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(34,197,94,0.4)]">
                                      <Check className="w-12 h-12 text-white" />
                                  </div>
                                  <h2 className="text-4xl font-bold text-white mb-4">Generation Complete!</h2>
                                  <p className="text-slate-400 mb-8">
                                      {config.target === TargetPlatform.PROXMOX_LXC 
                                        ? "Your Proxmox installation script is ready." 
                                        : "Your Docker Compose stack is ready."}
                                  </p>
                                  
                                  <div className="flex justify-center gap-4">
                                    <button onClick={() => setCurrentStep(1)} className="bg-slate-700 hover:bg-slate-600 text-white px-8 py-3 rounded-lg font-medium transition-all">
                                        Start Over
                                    </button>
                                    <button onClick={downloadScript} className="bg-orange-600 hover:bg-orange-500 text-white px-8 py-3 rounded-lg font-bold shadow-lg flex items-center">
                                        <Download className="w-5 h-5 mr-2" /> Download {config.target === TargetPlatform.PROXMOX_LXC ? '.sh' : '.yml'}
                                    </button>
                                  </div>

                                  {config.target === TargetPlatform.PROXMOX_LXC && (
                                      <div className="mt-8 bg-slate-800 rounded-lg p-4 text-left border border-slate-700">
                                          <p className="text-xs text-slate-500 uppercase font-bold mb-2">How to use:</p>
                                          <ol className="list-decimal list-inside text-sm text-slate-300 space-y-1">
                                              <li>Copy the <code className="bg-slate-900 px-1 rounded">.sh</code> file to your Proxmox HOST.</li>
                                              <li>Run <code className="bg-slate-900 px-1 rounded">chmod +x install-{config.appId}.sh</code></li>
                                              <li>Execute with <code className="bg-slate-900 px-1 rounded">./install-{config.appId}.sh</code></li>
                                          </ol>
                                      </div>
                                  )}
                              </div>
                          )}
                      </div>
                  </div>
              );
      }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-900 text-slate-200">
        {/* Navbar */}
        <nav className="bg-slate-950 border-b border-slate-800 h-16 flex items-center justify-between px-6 shrink-0 z-50 shadow-md">
            <div className="flex items-center gap-4">
                <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-900/50">
                    <ArrowRight className="w-6 h-6 rotate-45" /> {/* Makeshift Swap Icon */}
                </div>
                <div className="flex flex-col justify-center">
                    <h1 className="text-lg font-bold text-white tracking-tight leading-none">App Converter</h1>
                    <p className="text-[10px] text-orange-500 font-bold tracking-widest uppercase mt-0.5 opacity-90">Deploy Anywhere</p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="h-6 w-px bg-slate-800 mx-2 hidden md:block"></div>
                <button 
                  onClick={() => setIsSettingsOpen(true)}
                  className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center hover:bg-slate-700 transition-colors cursor-pointer"
                >
                    <Settings className="w-4 h-4 text-slate-400 group-hover:text-white" />
                </button>
            </div>
        </nav>

        {/* Settings Panel */}
        <SettingsPanel 
            isOpen={isSettingsOpen} 
            onClose={() => setIsSettingsOpen(false)} 
            repositories={repositories}
            onAddRepo={handleAddRepo}
            onRemoveRepo={handleRemoveRepo}
            onSync={handleSyncRepos}
        />

        {/* Content */}
        {!isManualInput && <StepWizard currentStep={currentStep} setStep={setCurrentStep} />}
        
        <main className="flex-grow flex flex-col relative overflow-hidden">
            {renderContent()}
        </main>
    </div>
  );
}

export default App;