import React from 'react';
import { AppDefinition } from '../types';
import { ArrowRight } from 'lucide-react';

interface AppCardProps {
  app: AppDefinition & { repoName?: string };
  onSelect: (app: AppDefinition) => void;
  showRepoTag?: boolean;
}

export const AppCard: React.FC<AppCardProps> = ({ app, onSelect, showRepoTag }) => {
  return (
    <div 
      onClick={() => onSelect(app)} 
      className="bg-slate-800 border border-slate-700 rounded-xl p-4 cursor-pointer flex items-center gap-4 hover:bg-slate-750 hover:border-slate-600 hover:-translate-y-1 transition-all duration-200 group relative overflow-hidden shadow-lg"
    >
      <div className="w-14 h-14 bg-white rounded-xl flex-shrink-0 p-1.5 shadow-md flex items-center justify-center overflow-hidden">
        <img src={app.image} alt={app.name} className="w-full h-full object-contain" />
      </div>
      <div className="flex-grow min-w-0 z-10">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-bold text-white text-base group-hover:text-orange-400 transition-colors truncate">
            {app.name}
          </h3>
          {showRepoTag && app.repoName && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-400 font-medium uppercase tracking-tighter shrink-0">
              {app.repoName}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
          {app.tagline || app.description}
        </p>
      </div>
      <div className="bg-slate-700/50 p-2 rounded-full group-hover:bg-orange-500 group-hover:text-white text-slate-500 transition-all z-10">
        <ArrowRight className="w-5 h-5" />
      </div>
    </div>
  );
};