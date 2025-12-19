import React from 'react';
import { TargetPlatform, AppDefinition } from '../types';
import { Server, Box, Check, ArrowLeft, ArrowRight } from 'lucide-react';

interface TargetSelectorProps {
  selectedApp: AppDefinition | null;
  target: TargetPlatform | null;
  onTargetSelect: (t: TargetPlatform) => void;
  onBack: () => void;
  onNext: () => void;
}

export const TargetSelector: React.FC<TargetSelectorProps> = ({ 
  selectedApp, 
  target, 
  onTargetSelect, 
  onBack, 
  onNext 
}) => {
  return (
    <div className="flex-grow flex flex-col items-center justify-start md:justify-center p-4 md:p-8 bg-slate-800/50 animate-fade-in overflow-y-auto pb-24 md:pb-8 w-full">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-6 md:mb-10 mt-4 md:mt-0">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Select Target</h2>
          <p className="text-sm md:text-base text-slate-400">Where do you want to deploy {selectedApp?.name}?</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div 
            onClick={() => onTargetSelect(TargetPlatform.PROXMOX_LXC)}
            className={`cursor-pointer bg-slate-800 border-2 rounded-xl p-6 transition-all shadow-lg group relative ${target === TargetPlatform.PROXMOX_LXC ? 'border-orange-500 bg-slate-750' : 'border-slate-700 hover:border-orange-500/50'}`}
          >
            <div className="absolute top-4 right-4 text-orange-500">
              {target === TargetPlatform.PROXMOX_LXC && <Check />}
            </div>
            <Server className={`w-12 h-12 mb-4 ${target === TargetPlatform.PROXMOX_LXC ? 'text-white' : 'text-slate-500'}`} />
            <h3 className="text-lg font-bold text-white mb-1">Proxmox LXC</h3>
            <p className="text-sm text-slate-400">Generates a host-side Bash script to create an LXC, install Docker, and deploy the app.</p>
          </div>

          <div 
            onClick={() => onTargetSelect(TargetPlatform.PORTAINER)}
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
          <button onClick={onBack} className="px-6 py-3 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 font-medium transition-colors flex items-center text-sm md:text-base">
            <ArrowLeft className="w-5 h-5 mr-2" /> Back
          </button>
          <button 
            onClick={onNext} 
            disabled={!target}
            className="bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 md:px-8 py-3 rounded-lg font-bold shadow-lg shadow-orange-600/30 transition-all flex items-center text-sm md:text-base"
          >
            Configure <ArrowRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};