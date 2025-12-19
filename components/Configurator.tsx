import React, { useState, useEffect } from 'react';
import { AppDefinition, DeploymentConfig, TargetPlatform } from '../types';
import { 
    ChevronUp, ChevronDown, Key, Cpu, Network, Variable, 
    ArrowLeft, ArrowRight, Rocket, Hash, Terminal, AlertTriangle 
} from 'lucide-react';

interface ConfiguratorProps {
  selectedApp: AppDefinition | null;
  config: DeploymentConfig;
  setConfig: React.Dispatch<React.SetStateAction<DeploymentConfig>>;
  onBack: () => void;
  onGenerate: () => void;
}

export const Configurator: React.FC<ConfiguratorProps> = ({ 
  selectedApp, 
  config, 
  setConfig, 
  onBack, 
  onGenerate 
}) => {
  const isProxmox = config.target === TargetPlatform.PROXMOX_LXC;
  const [activeAccordion, setActiveAccordion] = useState<'general' | 'resources' | 'network' | 'env'>('general');

  // Validation
  const isPasswordValid = !isProxmox || (config.password && config.password.length >= 5);

  // If not Proxmox, default to the environment config as it's the only applicable section
  useEffect(() => {
    if (!isProxmox) {
      setActiveAccordion('env');
    }
  }, [isProxmox]);

  const renderEnvVars = () => {
    const keys = Object.keys(config.envVars);
    if (keys.length === 0) {
        return <div className="text-slate-500 text-sm italic">No environment variables detected in this stack.</div>;
    }
    return (
        <div className="space-y-3">
            {keys.map((key) => (
                <div key={key} className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 items-center">
                    <div className="col-span-1 text-xs font-bold text-slate-400 break-all">{key}</div>
                    <div className="col-span-2">
                        <input 
                            type="text" 
                            value={config.envVars[key]} 
                            onChange={(e) => {
                                const newEnv = {...config.envVars, [key]: e.target.value};
                                setConfig({...config, envVars: newEnv});
                            }}
                            className="w-full bg-slate-900 border border-slate-600 text-white p-2 text-xs rounded focus:border-orange-500 focus:outline-none transition-colors"
                        />
                    </div>
                </div>
            ))}
        </div>
    );
  };

  return (
    <div className="flex-grow p-4 md:p-10 bg-slate-800/50 overflow-y-auto">
        <div className="max-w-5xl mx-auto h-full flex flex-col">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-white rounded-lg p-1 flex items-center justify-center shadow-md">
                    <img src={selectedApp?.image} alt="icon" className="max-w-full max-h-full object-contain" />
                </div>
                <div>
                    <h2 className="text-xl md:text-2xl font-bold text-white">Configure {selectedApp?.name}</h2>
                    <p className="text-sm text-slate-400">
                        Target: <span className="text-orange-500 font-medium">{config.target.replace('_', ' ')}</span>
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-grow items-start pb-20 md:pb-0">
                <div className="lg:col-span-2 space-y-4">
                    
                    {isProxmox && (
                        <>
                            {/* Proxmox: General Accordion */}
                            <div className={`bg-slate-900 border ${activeAccordion === 'general' ? 'border-orange-500/50' : 'border-slate-700'} rounded-xl transition-all duration-300 overflow-hidden shadow-xl`}>
                                <button onClick={() => setActiveAccordion('general')} className={`w-full flex items-center justify-between p-6 ${activeAccordion === 'general' ? 'bg-slate-800' : 'bg-slate-900 hover:bg-slate-800'} transition-colors`}>
                                    <h3 className={`text-lg font-medium flex items-center gap-3 ${activeAccordion === 'general' ? 'text-white' : 'text-slate-400'}`}>
                                    <Key className={`w-5 h-5 ${activeAccordion === 'general' ? 'text-orange-500' : 'text-slate-500'}`} />
                                    General & Credentials
                                    </h3>
                                    {activeAccordion === 'general' ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                                </button>
                                {activeAccordion === 'general' && (
                                    <div className="p-6 border-t border-slate-800 bg-slate-800/30">
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1.5"><Hash className="w-3 h-3" /> Container ID</label>
                                                    <input type="number" value={config.ctId} onChange={(e) => setConfig({...config, ctId: parseInt(e.target.value) || 105})} className="w-full bg-slate-900 border border-slate-600 text-white p-3 rounded-lg focus:border-orange-500 focus:outline-none" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">LXC Hostname</label>
                                                    <input type="text" value={config.appId} onChange={(e) => setConfig({...config, appId: e.target.value})} className="w-full bg-slate-900 border border-slate-600 text-white p-3 rounded-lg focus:border-orange-500 focus:outline-none" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Root Password</label>
                                                <input 
                                                    type="password" 
                                                    value={config.password} 
                                                    onChange={(e) => setConfig({...config, password: e.target.value})} 
                                                    className={`w-full bg-slate-900 border ${!isPasswordValid ? 'border-red-500' : 'border-slate-600'} text-white p-3 rounded-lg focus:border-orange-500 focus:outline-none`} 
                                                />
                                                {!isPasswordValid && (
                                                    <p className="text-[10px] text-red-500 mt-2 flex items-center gap-1">
                                                        <AlertTriangle className="w-3 h-3" /> Password must be at least 5 characters for Proxmox scripts.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex justify-end pt-6 mt-4 border-t border-slate-700/50">
                                            <button onClick={() => setActiveAccordion('resources')} className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-lg flex items-center gap-2">Next <ArrowRight className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Proxmox: Resources Accordion */}
                            <div className={`bg-slate-900 border ${activeAccordion === 'resources' ? 'border-orange-500/50' : 'border-slate-700'} rounded-xl transition-all duration-300 overflow-hidden shadow-xl`}>
                                <button onClick={() => setActiveAccordion('resources')} className={`w-full flex items-center justify-between p-6 ${activeAccordion === 'resources' ? 'bg-slate-800' : 'bg-slate-900 hover:bg-slate-800'} transition-colors`}>
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
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Storage Pool</label>
                                                <input type="text" value={config.storagePool} onChange={(e) => setConfig({...config, storagePool: e.target.value})} className="w-full bg-slate-900 border border-slate-600 text-white p-3 rounded-lg focus:border-orange-500 focus:outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Disk (GB)</label>
                                                <input type="number" value={config.diskSize} onChange={(e) => setConfig({...config, diskSize: parseInt(e.target.value) || 4})} className="w-full bg-slate-900 border border-slate-600 text-white p-3 rounded-lg focus:border-orange-500 focus:outline-none" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">CPU Cores</label>
                                                <input type="number" value={config.cpuCores} onChange={(e) => setConfig({...config, cpuCores: parseInt(e.target.value) || 1})} className="w-full bg-slate-900 border border-slate-600 text-white p-3 rounded-lg focus:border-orange-500 focus:outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">RAM (MB)</label>
                                                <input type="number" value={config.ramSize} onChange={(e) => setConfig({...config, ramSize: parseInt(e.target.value) || 1024})} className="w-full bg-slate-900 border border-slate-600 text-white p-3 rounded-lg focus:border-orange-500 focus:outline-none" />
                                            </div>
                                        </div>
                                        <div className="flex justify-between pt-4 border-t border-slate-700/50">
                                            <button onClick={() => setActiveAccordion('general')} className="text-xs font-bold text-slate-500 hover:text-white flex items-center gap-1"><ArrowLeft className="w-3 h-3"/> Back</button>
                                            <button onClick={() => setActiveAccordion('network')} className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-lg flex items-center gap-2">Next <ArrowRight className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Proxmox: Network Accordion */}
                            <div className={`bg-slate-900 border ${activeAccordion === 'network' ? 'border-orange-500/50' : 'border-slate-700'} rounded-xl transition-all duration-300 overflow-hidden shadow-xl`}>
                                <button onClick={() => setActiveAccordion('network')} className={`w-full flex items-center justify-between p-6 ${activeAccordion === 'network' ? 'bg-slate-800' : 'bg-slate-900 hover:bg-slate-800'} transition-colors`}>
                                    <h3 className={`text-lg font-medium flex items-center gap-3 ${activeAccordion === 'network' ? 'text-white' : 'text-slate-400'}`}>
                                    <Network className={`w-5 h-5 ${activeAccordion === 'network' ? 'text-orange-500' : 'text-slate-500'}`} />
                                    Network
                                    </h3>
                                    {activeAccordion === 'network' ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                                </button>
                                {activeAccordion === 'network' && (
                                    <div className="p-6 border-t border-slate-800 bg-slate-800/30">
                                        <div className="grid grid-cols-2 gap-6 mb-6">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Bridge</label>
                                                <input type="text" value={config.bridge} onChange={(e) => setConfig({...config, bridge: e.target.value})} className="w-full bg-slate-900 border border-slate-600 text-white p-3 rounded-lg focus:border-orange-500 focus:outline-none" />
                                            </div>
                                            <div className="flex items-center">
                                                <label className="flex items-center cursor-pointer mt-6">
                                                    <div className="relative">
                                                        <input type="checkbox" className="sr-only" checked={!config.useDhcp} onChange={() => setConfig({...config, useDhcp: !config.useDhcp})} />
                                                        <div className={`block w-14 h-8 rounded-full transition-colors ${!config.useDhcp ? 'bg-orange-600' : 'bg-slate-700'}`}></div>
                                                        <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${!config.useDhcp ? 'transform translate-x-6' : ''}`}></div>
                                                    </div>
                                                    <div className="ml-3 text-sm font-medium text-slate-300">{config.useDhcp ? 'DHCP' : 'Static'}</div>
                                                </label>
                                            </div>
                                        </div>
                                        {!config.useDhcp && (
                                            <div className="grid grid-cols-2 gap-6 mb-6 animate-fade-in">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">IP/CIDR</label>
                                                    <input type="text" value={config.staticIp} onChange={(e) => setConfig({...config, staticIp: e.target.value})} className="w-full bg-slate-900 border border-slate-600 text-white p-3 rounded-lg focus:border-orange-500 focus:outline-none" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Gateway</label>
                                                    <input type="text" value={config.gateway} onChange={(e) => setConfig({...config, gateway: e.target.value})} className="w-full bg-slate-900 border border-slate-600 text-white p-3 rounded-lg focus:border-orange-500 focus:outline-none" />
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex justify-between pt-4 border-t border-slate-700/50">
                                            <button onClick={() => setActiveAccordion('resources')} className="text-xs font-bold text-slate-500 hover:text-white flex items-center gap-1"><ArrowLeft className="w-3 h-3"/> Back</button>
                                            <button onClick={() => setActiveAccordion('env')} className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-lg flex items-center gap-2">Next <ArrowRight className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* App Config Accordion (Universal) */}
                    <div className={`bg-slate-900 border ${activeAccordion === 'env' ? 'border-orange-500/50' : 'border-slate-700'} rounded-xl transition-all duration-300 overflow-hidden shadow-xl`}>
                        <button onClick={() => setActiveAccordion('env')} className={`w-full flex items-center justify-between p-6 ${activeAccordion === 'env' ? 'bg-slate-800' : 'bg-slate-900 hover:bg-slate-800'} transition-colors`}>
                            <h3 className={`text-lg font-medium flex items-center gap-3 ${activeAccordion === 'env' ? 'text-white' : 'text-slate-400'}`}>
                               <Variable className={`w-5 h-5 ${activeAccordion === 'env' ? 'text-orange-500' : 'text-slate-500'}`} />
                               Environment Variables
                            </h3>
                            {isProxmox && (activeAccordion === 'env' ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />)}
                        </button>
                        {activeAccordion === 'env' && (
                            <div className="p-6 border-t border-slate-800 bg-slate-800/30">
                                <div className="mb-8 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                                    {renderEnvVars()}
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                                    <button 
                                        onClick={isProxmox ? () => setActiveAccordion('network') : onBack} 
                                        className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
                                    >
                                        <ArrowLeft className="w-3 h-3" /> Back
                                    </button>
                                    <button 
                                        onClick={onGenerate} 
                                        disabled={!isPasswordValid}
                                        className="bg-gradient-to-r from-orange-600 to-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-2.5 rounded-lg font-bold text-sm shadow-lg flex items-center gap-2 active:scale-95 transition-all"
                                    >
                                        <Rocket className="w-4 h-4" /> Generate {isProxmox ? 'LXC Script' : 'Compose Stack'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Preview */}
                <div className="space-y-6">
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-6">
                        <h4 className="text-orange-400 font-bold mb-2 flex items-center gap-2">
                            <Terminal className="w-4 h-4" /> Tip
                        </h4>
                        <p className="text-sm text-slate-300 leading-relaxed">
                            {config.target === TargetPlatform.PROXMOX_LXC 
                                ? "This wizard will generate a Bash script that automatically configures your Proxmox container resources, network, and Docker environment. Minimum password length: 5." 
                                : "You've selected a container-native target. We'll provide a cleaned Docker Compose file that you can paste directly into Portainer or Dockge."}
                        </p>
                    </div>
                    <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-xl hidden lg:block">
                        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                            <Terminal className="w-5 h-5 text-blue-500" /> YAML Preview
                        </h3>
                        <textarea 
                            className="w-full h-80 bg-slate-950 text-[10px] font-mono text-green-400 p-4 rounded-lg border border-slate-800 focus:outline-none resize-none custom-scrollbar" 
                            value={config.composeContent} 
                            readOnly 
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};