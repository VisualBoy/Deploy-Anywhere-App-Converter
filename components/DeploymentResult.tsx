import React, { useState } from 'react';
import { DeploymentConfig, TargetPlatform } from '../types';
import { Check, Download, Terminal, Copy, ClipboardCheck } from 'lucide-react';
import { generateProxmoxScript, generateExecutionCommand } from '../services/scriptGenerator';

interface DeploymentResultProps {
  deployed: boolean;
  deploying: boolean;
  deploymentLog: string[];
  config: DeploymentConfig;
  onStartOver: () => void;
  onDownload: () => void;
}

export const DeploymentResult: React.FC<DeploymentResultProps> = ({ 
  deployed, 
  deploying,
  deploymentLog, 
  config, 
  onStartOver, 
  onDownload 
}) => {
  const [copied, setCopied] = useState(false);

  const isProxmox = config.target === TargetPlatform.PROXMOX_LXC;

  const handleCopyOneLiner = () => {
    const script = generateProxmoxScript(config);
    const command = generateExecutionCommand(script);
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-grow flex flex-col items-center justify-center p-8 bg-slate-900 overflow-y-auto">
      <div className="max-w-3xl w-full text-center py-8">
        {!deployed ? (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-white animate-pulse">
              {deploying ? 'Generating...' : 'Preparing...'}
            </h2>
            <div className="bg-black/50 rounded-lg border border-slate-700 p-4 font-mono text-left h-64 overflow-y-auto mt-4 custom-scrollbar">
              {deploymentLog.map((log, i) => (
                <div key={i} className="text-xs text-green-400">
                  [{new Date().toLocaleTimeString()}] {log}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="animate-fade-in">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_25px_rgba(34,197,94,0.4)]">
              <Check className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-white mb-2">Success!</h2>
            <p className="text-slate-400 mb-8">
              Your {isProxmox ? 'installation script' : 'stack file'} for {config.appName} is ready.
            </p>
            
            {isProxmox ? (
                <div className="mb-10 text-left bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
                    <h4 className="text-sm font-bold text-white uppercase mb-4 flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-orange-500" /> Run on Proxmox Host
                    </h4>
                    <p className="text-xs text-slate-400 mb-3">
                        Copy and paste this command directly into your Proxmox Host Shell. This will download the script in memory and execute it.
                    </p>
                    
                    <div className="relative group">
                        <div className="bg-slate-950 p-4 pr-12 rounded-lg border border-slate-700 font-mono text-xs md:text-sm text-green-400 whitespace-nowrap overflow-x-auto shadow-inner custom-scrollbar">
                            {generateExecutionCommand(generateProxmoxScript(config))}
                        </div>
                        <button 
                            onClick={handleCopyOneLiner}
                            className="absolute top-2 right-2 p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded transition-colors border border-slate-600 shadow-lg z-10"
                            title="Copy Command"
                        >
                            {copied ? <ClipboardCheck className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-500">
                        <span className="bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">Note</span>
                        Auto-generated credentials will be saved to <code className="text-orange-400">/opt/{config.appId}/install_details.conf</code> inside the LXC.
                    </div>
                </div>
            ) : (
                <div className="flex justify-center gap-4 mb-10">
                    <button onClick={onDownload} className="bg-orange-600 hover:bg-orange-500 text-white px-8 py-3 rounded-lg font-bold shadow-lg flex items-center transition-all">
                        <Download className="w-5 h-5 mr-2" /> Download Compose
                    </button>
                </div>
            )}

            <div className="flex justify-center gap-4">
              <button onClick={onStartOver} className="text-slate-500 hover:text-white px-6 py-2 rounded-lg font-medium transition-colors text-sm">
                 Convert Another App
              </button>
              {isProxmox && (
                  <button onClick={onDownload} className="flex items-center gap-2 text-slate-500 hover:text-orange-500 px-6 py-2 rounded-lg font-medium transition-colors text-sm">
                      <Download className="w-4 h-4" /> Download .sh file instead
                  </button>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
};