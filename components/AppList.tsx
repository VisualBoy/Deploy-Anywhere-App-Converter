import React from 'react';
import { AppDefinition } from '../types';
import { AppCard } from './AppCard';
import { Search } from 'lucide-react';

interface AppListProps {
  apps: (AppDefinition & { repoName?: string })[];
  onSelectApp: (app: AppDefinition) => void;
  showRepoTags?: boolean;
}

export const AppList: React.FC<AppListProps> = ({ apps, onSelectApp, showRepoTags }) => {
  if (apps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500">
        <Search className="w-16 h-16 mb-4 text-slate-700" />
        <p className="text-lg">No apps found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {apps.map((app) => (
        <AppCard 
          key={`${app.id}-${app.repoName || 'local'}`} 
          app={app} 
          onSelect={onSelectApp} 
          showRepoTag={showRepoTags}
        />
      ))}
    </div>
  );
};