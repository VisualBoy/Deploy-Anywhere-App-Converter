import React, { useState, useMemo } from 'react';
import { Repo, AppDefinition } from '../types';
import { Search, ArrowRight, FileJson, Filter, Globe, RefreshCw, Plus } from 'lucide-react';
import { AppList } from './AppList';

interface AppLibraryProps {
  repositories: Repo[];
  onSelectApp: (app: AppDefinition) => void;
  onManualYaml: () => void;
  onSync: () => Promise<void>;
  onOpenSettings: () => void;
  isSyncing: boolean;
  syncStatus?: string;
}

export const AppLibrary: React.FC<AppLibraryProps> = ({ 
  repositories, 
  onSelectApp, 
  onManualYaml, 
  onSync, 
  onOpenSettings,
  isSyncing,
  syncStatus
}) => {
  const [selectedRepoId, setSelectedRepoId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const totalAppsCount = useMemo(() => repositories.reduce((acc, r) => acc + r.apps.length, 0), [repositories]);

  const displayedApps = useMemo(() => {
    if (selectedRepoId === 'all') {
        return repositories.flatMap(r => r.apps.map(app => ({ ...app, repoName: r.name })));
    }
    const repo = repositories.find(r => r.id === selectedRepoId);
    return repo ? repo.apps.map(app => ({ ...app, repoName: repo.name })) : [];
  }, [repositories, selectedRepoId]);

  const filteredApps = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return displayedApps.filter(app => 
      app.name.toLowerCase().includes(query) ||
      app.description.toLowerCase().includes(query) ||
      (app as any).repoName?.toLowerCase().includes(query)
    );
  }, [displayedApps, searchQuery]);

  const renderEmptyState = () => {
    if (repositories.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full py-20 text-center px-6">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 border border-slate-700">
            <Globe className="w-10 h-10 text-slate-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Sources Configured</h3>
          <p className="text-slate-400 max-w-md mb-8">Add repository sources to browse and convert applications from the community.</p>
          <button 
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-8 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" /> Add Sources
          </button>
        </div>
      );
    }

    if (totalAppsCount === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full py-20 text-center px-6">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 border border-slate-700">
            <RefreshCw className={`w-10 h-10 text-orange-500 ${isSyncing ? 'animate-spin' : ''}`} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Library is Empty</h3>
          <p className="text-slate-400 max-w-md mb-8">Synchronize with configured repositories to fetch the latest application lists.</p>
          <div className="flex flex-col items-center gap-3">
            <button 
                onClick={onSync}
                disabled={isSyncing}
                className="flex items-center gap-2 px-8 py-3 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-700 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95 min-w-[160px] justify-center"
            >
                {isSyncing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
            {syncStatus && (
                <p className="text-sm font-medium text-orange-400 animate-pulse mt-1">
                    {syncStatus}
                </p>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500">
        <Search className="w-16 h-16 mb-4 text-slate-700" />
        <p className="text-lg">No apps match your search criteria.</p>
      </div>
    );
  };

  return (
    <div className="flex h-full relative overflow-hidden">
      {/* Sidebar */}
      <aside className={`
          absolute inset-0 z-30 bg-slate-900 
          md:relative md:inset-auto md:w-80 lg:w-96 md:border-r border-slate-800 
          flex flex-col p-6 shadow-2xl md:shadow-xl shrink-0 
          transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
      `}>
        <div className="mb-8">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Source Market</label>
            <div className="relative mb-5 group">
                <select 
                    value={selectedRepoId}
                    onChange={(e) => setSelectedRepoId(e.target.value)}
                    className="w-full appearance-none bg-slate-800 border border-slate-700 text-slate-200 py-3 px-4 pr-10 rounded-lg focus:outline-none focus:border-orange-500 transition-all cursor-pointer shadow-sm font-medium"
                >
                    <option value="all">All Repositories ({totalAppsCount})</option>
                    {repositories.map(repo => (
                        <option key={repo.id} value={repo.id}>{repo.name} ({repo.apps.length})</option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                    <Globe className="w-4 h-4" />
                </div>
            </div>

            <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 group-focus-within:text-orange-500 transition-colors">
                    <Search className="w-5 h-5" />
                </span>
                <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white py-2.5 pl-10 pr-4 rounded-lg focus:outline-none focus:border-orange-500 placeholder-slate-500 transition-all shadow-inner" 
                    placeholder="Search apps globally..."
                />
            </div>
        </div>

        <div className="mt-auto flex flex-col gap-4">
             <div className="flex flex-col items-center justify-center p-6 bg-slate-800/30 rounded-xl border border-dashed border-slate-700">
                 <FileJson className="w-10 h-10 text-orange-500/50 mb-3" />
                 <p className="text-slate-400 text-sm mb-4 text-center">Have a custom Docker Compose?</p>
                 <button onClick={onManualYaml} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-orange-500 font-medium transition-all border border-slate-700 w-full justify-center shadow-lg">
                    <span>Import YAML</span>
                </button>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden w-full bg-orange-600 text-white py-3 rounded-lg font-bold shadow-lg flex items-center justify-center gap-2">
                Browse Apps <ArrowRight className="w-5 h-5" />
            </button>
        </div>
      </aside>

      {/* Main Grid */}
      <div className="flex-grow p-6 md:p-10 overflow-y-auto bg-slate-800/50 w-full">
        <div className="max-w-6xl mx-auto h-full">
            {totalAppsCount > 0 && filteredApps.length > 0 ? (
              <>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-white">
                        {selectedRepoId === 'all' ? 'All Applications' : repositories.find(r => r.id === selectedRepoId)?.name}
                    </h3>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setIsSidebarOpen(true)} className="md:hidden flex items-center gap-2 bg-slate-800 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 text-sm font-medium"><Filter className="w-4 h-4" /> Filters</button>
                        <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">{filteredApps.length} Apps</span>
                    </div>
                </div>

                <AppList 
                  apps={filteredApps} 
                  onSelectApp={onSelectApp} 
                  showRepoTags={selectedRepoId === 'all'} 
                />
              </>
            ) : (
              renderEmptyState()
            )}
        </div>
      </div>
    </div>
  );
};