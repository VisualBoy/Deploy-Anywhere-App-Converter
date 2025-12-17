import React, { useState } from 'react';
import { Repo } from '../types';
import { X, Plus, RefreshCw, Trash2, Github, Globe } from 'lucide-react';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  repositories: Repo[];
  onAddRepo: (name: string, url: string) => void;
  onRemoveRepo: (id: string) => void;
  onSync: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
  isOpen, 
  onClose, 
  repositories, 
  onAddRepo, 
  onRemoveRepo,
  onSync 
}) => {
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoUrl, setNewRepoUrl] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const handleAdd = () => {
    if (newRepoName && newRepoUrl) {
      onAddRepo(newRepoName, newRepoUrl);
      setNewRepoName('');
      setNewRepoUrl('');
    }
  };

  const handleSync = () => {
    setIsSyncing(true);
    // Simulate sync delay
    setTimeout(() => {
        onSync();
        setIsSyncing(false);
    }, 2000);
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Slide-in Panel */}
      <div className={`fixed inset-y-0 right-0 w-full md:w-[480px] bg-slate-900 border-l border-slate-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950">
            <div>
                <h2 className="text-xl font-bold text-white">Repositories</h2>
                <p className="text-xs text-slate-500">Manage your App Store sources</p>
            </div>
            <div className="flex items-center gap-2">
                 <button 
                    onClick={handleSync}
                    disabled={isSyncing}
                    className={`p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-orange-500 transition-all ${isSyncing ? 'animate-spin opacity-50' : ''}`}
                    title="Sync Repositories"
                 >
                    <RefreshCw className="w-5 h-5" />
                 </button>
                <button 
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-grow overflow-y-auto p-6 space-y-6">
            
            {/* Add New Section */}
            <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                <h3 className="text-sm font-bold text-white uppercase mb-4 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-orange-500" /> Add Source
                </h3>
                <div className="space-y-3">
                    <div>
                        <input 
                            type="text" 
                            placeholder="Repository Name (e.g. My Repo)"
                            value={newRepoName}
                            onChange={(e) => setNewRepoName(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-2 rounded-lg text-sm focus:border-orange-500 focus:outline-none placeholder-slate-600"
                        />
                    </div>
                    <div>
                        <input 
                            type="text" 
                            placeholder="URL (e.g. https://github.com/.../apps.json)"
                            value={newRepoUrl}
                            onChange={(e) => setNewRepoUrl(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-2 rounded-lg text-sm focus:border-orange-500 focus:outline-none placeholder-slate-600"
                        />
                    </div>
                    <button 
                        onClick={handleAdd}
                        disabled={!newRepoName || !newRepoUrl}
                        className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded-lg text-sm font-bold transition-colors"
                    >
                        Add Repository
                    </button>
                </div>
            </div>

            {/* List Section */}
            <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 px-1">Active Sources ({repositories.length})</h3>
                <div className="space-y-3">
                    {repositories.map((repo) => (
                        <div key={repo.id} className="group bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center justify-between hover:border-slate-600 transition-all">
                            <div className="flex-grow min-w-0 pr-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-bold text-white truncate">{repo.name}</h4>
                                    <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">{repo.apps.length} apps</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
                                    {repo.url && repo.url.includes('github') ? <Github className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                                    <a href={repo.url} target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 hover:underline truncate">
                                        {repo.url || 'Local Repository'}
                                    </a>
                                </div>
                            </div>
                            <button 
                                onClick={() => onRemoveRepo(repo.id)}
                                className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                title="Remove Repository"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-950 text-center">
              <p className="text-[10px] text-slate-600">
                  App Converter v1.2.0 • Data provided by Community Scripts & BigBear
              </p>
          </div>
        </div>
      </div>
    </>
  );
};