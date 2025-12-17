import React, { useState, useMemo, useEffect } from 'react';
import { Repo, AppDefinition } from '../types';
import { Search, ArrowRight, FileJson, LayoutGrid, Filter } from 'lucide-react';

interface AppLibraryProps {
  repositories: Repo[];
  onSelectApp: (app: AppDefinition) => void;
  onManualYaml: () => void;
}

export const AppLibrary: React.FC<AppLibraryProps> = ({ repositories, onSelectApp, onManualYaml }) => {
  const [selectedRepoId, setSelectedRepoId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Default to first repo if selectedRepoId is invalid or empty
  useEffect(() => {
      if (repositories.length > 0 && (!selectedRepoId || !repositories.find(r => r.id === selectedRepoId))) {
          setSelectedRepoId(repositories[0].id);
      }
  }, [repositories, selectedRepoId]);

  const activeRepo = repositories.find(r => r.id === selectedRepoId) || repositories[0];
  
  const filteredApps = useMemo(() => {
    if (!activeRepo) return [];
    return activeRepo.apps.filter(app => 
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeRepo, searchQuery]);

  if (!activeRepo) {
      return (
          <div className="flex-grow flex items-center justify-center text-slate-500">
              No repositories configured. Use settings to add one.
          </div>
      );
  }

  return (
    <div className="flex h-full relative overflow-hidden">
      {/* Sidebar / Filters */}
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
                    className="w-full appearance-none bg-slate-800 border border-slate-700 text-slate-200 py-3 px-4 pr-10 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all cursor-pointer shadow-sm font-medium"
                >
                    {repositories.map(repo => (
                        <option key={repo.id} value={repo.id}>{repo.name}</option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                    <LayoutGrid className="w-4 h-4" />
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
                    className="w-full bg-slate-800 border border-slate-700 text-white py-2.5 pl-10 pr-4 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 placeholder-slate-500 transition-all shadow-inner" 
                    placeholder="Search apps (e.g. Plex)..."
                />
            </div>
        </div>

        <div className="mt-auto flex flex-col gap-4">
             <div className="flex flex-col items-center justify-center p-6 bg-slate-800/30 rounded-xl border border-dashed border-slate-700">
                 <FileJson className="w-10 h-10 text-orange-500/50 mb-3" />
                 <p className="text-slate-400 text-sm mb-4 text-center">Have a custom Docker Compose?</p>
                 <button 
                    onClick={onManualYaml}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-orange-500 hover:text-orange-400 font-medium transition-all border border-slate-700 hover:border-orange-500/30 w-full justify-center shadow-lg"
                >
                    <span>Import YAML</span>
                </button>
            </div>

            {/* Mobile Only: Browse Button */}
            <button 
                onClick={() => setIsSidebarOpen(false)}
                className="md:hidden w-full bg-orange-600 hover:bg-orange-500 text-white py-3 rounded-lg font-bold shadow-lg flex items-center justify-center gap-2 transition-colors"
            >
                Browse Apps <ArrowRight className="w-5 h-5" />
            </button>
        </div>
      </aside>

      {/* Main Grid */}
      <div className="flex-grow p-6 md:p-10 overflow-y-auto bg-slate-800/50 w-full">
        <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-white">Available Applications</h3>
                
                <div className="flex items-center gap-3">
                    {/* Mobile Filter Toggle */}
                    <button 
                        onClick={() => setIsSidebarOpen(true)}
                        className="md:hidden flex items-center gap-2 bg-slate-800 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 text-sm font-medium hover:bg-slate-700 transition-colors"
                    >
                        <Filter className="w-4 h-4" /> Filters
                    </button>

                    <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                        {filteredApps.length} Apps
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredApps.map((app) => (
                    <div 
                        key={app.id}
                        onClick={() => onSelectApp(app)}
                        className="bg-slate-800 border border-slate-700 rounded-xl p-4 cursor-pointer flex items-center gap-4 hover:bg-slate-750 hover:border-slate-600 hover:-translate-y-1 transition-all duration-200 group relative overflow-hidden shadow-lg"
                    >
                        <div className="w-14 h-14 bg-white rounded-xl flex-shrink-0 p-1.5 shadow-md flex items-center justify-center overflow-hidden">
                            <img src={app.image} alt={app.name} className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-grow min-w-0 z-10">
                            <h3 className="font-bold text-white text-base mb-1 group-hover:text-orange-400 transition-colors">
                                {app.name}
                            </h3>
                            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                                {app.description}
                            </p>
                        </div>
                        <div className="bg-slate-700/50 p-2 rounded-full group-hover:bg-orange-500 group-hover:text-white text-slate-500 transition-all z-10">
                            <ArrowRight className="w-5 h-5" />
                        </div>
                    </div>
                ))}
            </div>

            {filteredApps.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 text-slate-500">
                    <Search className="w-16 h-16 mb-4 text-slate-700" />
                    <p className="text-lg">No apps found for this search.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};