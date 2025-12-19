import React from 'react';
import { DeploymentConfig, TargetPlatform } from '../types';
import { Check, Download, Terminal } from 'lucide-react';

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
  return (
    <div className="flex-grow flex flex-col items-center justify-center p-8 bg-slate-900">
      <div className="max-w-2xl w-full text-center">
        {!deployed ? (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-white animate-pulse">
              {deploying ? 'Generating...' : 'Preparing...'}
            </h2>
            <div className="bg-black/50 rounded-lg border border-slate-700 p-4 font-mono text-left h-64 overflow-y-auto mt-4">
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
              Your {config.target === TargetPlatform.PROXMOX_LXC ? 'installation script' : 'stack file'} for {config.appName} is ready.
            </p>
            
            <div className="flex justify-center gap-4 mb-10">
              <button onClick={onStartOver} className="bg-slate-700 hover:bg-slate-600 text-white px-8 py-3 rounded-lg font-medium transition-all">Start Over</button>
              <button onClick={onDownload} className="bg-orange-600 hover:bg-orange-500 text-white px-8 py-3 rounded-lg font-bold shadow-lg flex items-center transition-all"><Download className="w-5 h-5 mr-2" /> Download</button>
            </div>

            {config.target === TargetPlatform.PROXMOX_LXC && (
              <div className="text-left bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-2xl">
                <h4 className="text-sm font-bold text-orange-500 uppercase mb-4 flex items-center gap-2">
                  <Terminal className="w-4 h-4" /> Quick Installation Guide
                </h4>
                <div className="space-y-4 font-mono text-xs md:text-sm">
                  <div className="flex gap-3">
                    <span className="text-slate-500 font-bold">1.</span>
                    <p className="text-slate-300">Transfer the script to your Proxmox Host.</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-slate-500 font-bold">2.</span>
                    <div>
                      <p className="text-slate-300 mb-2">Make it executable:</p>
                      <code className="block bg-slate-950 p-2 rounded border border-slate-700 text-orange-400">chmod +x install-{config.appId}.sh</code>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-slate-500 font-bold">3.</span>
                    <div>
                      <p className="text-slate-300 mb-2">Run the installer:</p>
                      <code className="block bg-slate-950 p-2 rounded border border-slate-700 text-orange-400">./install-{config.appId}.sh</code>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};