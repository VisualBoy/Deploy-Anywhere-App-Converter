import React, { useState, useEffect } from 'react';
import { Repo } from '../types';
import { X, Plus, RefreshCw, Trash2, Github, Globe, Loader2, Eye, EyeOff, AlertCircle, Check } from 'lucide-react';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  repositories: Repo[];
  onAddRepo: (name: string, url: string) => Promise<void>;
  onRemoveRepo: (id: string) => void;
  onSync: () => Promise<void>;
  isSyncingExternal: boolean;
  syncStatus?: string;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
  isOpen, 
  onClose, 
  repositories, 
  onAddRepo, 
  onRemoveRepo,
  onSync,
  isSyncingExternal,
  syncStatus
}) => {
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoUrl, setNewRepoUrl] = useState('');
  const [isLocalFetching, setIsLocalFetching] = useState(false);
  
  const [githubPat, setGithubPat] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('app-converter-github-pat') || '';
    }
    return '';
  });
  const [isPatSaved, setIsPatSaved] = useState(false);
  const [showPat, setShowPat] = useState(false);

  const [isRateLimitActive, setIsRateLimitActive] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('github-rate-limit-exceeded') === 'true';
    }
    return false;
  });

  // Keep rate limit active updated when panel opens/focuses
  useEffect(() => {
    if (isOpen) {
      setIsRateLimitActive(sessionStorage.getItem('github-rate-limit-exceeded') === 'true');
    }
  }, [isOpen]);

  const handleSavePat = () => {
    const trimmed = githubPat.trim();
    if (trimmed) {
      localStorage.setItem('app-converter-github-pat', trimmed);
    } else {
      localStorage.removeItem('app-converter-github-pat');
    }
    
    // Clear rate limit flags so they can try again
    sessionStorage.removeItem('github-rate-limit-exceeded');
    setIsRateLimitActive(false);

    setIsPatSaved(true);
    setTimeout(() => {
      setIsPatSaved(false);
    }, 2500);
  };

  const isSyncing = isSyncingExternal || isLocalFetching;

  const handleAdd = async () => {
    if (newRepoName && newRepoUrl) {
      setIsLocalFetching(true);
      try {
        await onAddRepo(newRepoName, newRepoUrl);
        setNewRepoName('');
        setNewRepoUrl('');
      } finally {
        setIsLocalFetching(false);
      }
    }
  };

  const handleSync = async () => {
    setIsLocalFetching(true);
    try {
      await onSync();
    } finally {
      setIsLocalFetching(false);
    }
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
            <div className="flex items-center gap-4">
                 <div className="flex items-center gap-3">
                    {syncStatus && isSyncing && (
                        <span className="text-xs font-medium text-orange-500 animate-pulse hidden md:inline">
                            {syncStatus}
                        </span>
                    )}
                    <button 
                        onClick={handleSync}
                        disabled={isSyncing}
                        className={`p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-orange-500 transition-all ${isSyncing ? 'opacity-50' : ''}`}
                        title="Sync Repositories"
                    >
                        <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
                    </button>
                 </div>
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

            {/* Rate limit warning banner */}
            {isRateLimitActive && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-200 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-red-400">GitHub Rate Limit Exceeded</h4>
                  <p className="text-xs text-red-300/85 mt-1 leading-relaxed">
                    Your current IP address has hit GitHub's unauthenticated limit of 60 requests/hour. Set a GitHub Personal Access Token (PAT) below to increase your quota to 5,000 requests/hour.
                  </p>
                </div>
              </div>
            )}

            {/* GitHub PAT config card */}
            <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                <h3 className="text-sm font-bold text-white uppercase mb-3 flex items-center gap-2">
                    <Github className="w-4 h-4 text-orange-500" /> GitHub Token (PAT)
                </h3>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                    Providing a Personal Access Token increases the GitHub API limit from 60 to 5,000 requests per hour. No special scopes are required for reading public repositories.
                </p>
                <div className="space-y-3">
                    <div className="relative">
                        <input 
                            type={showPat ? "text" : "password"} 
                            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                            value={githubPat}
                            onChange={(e) => setGithubPat(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-white pl-4 pr-10 py-2 rounded-lg text-sm focus:border-orange-500 focus:outline-none placeholder-slate-600 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPat(!showPat)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 select-none cursor-pointer"
                        >
                          {showPat ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                    
                    <div className="flex items-center justify-between gap-4">
                        <div className="text-[11px] text-slate-500">
                            {githubPat ? (
                                <span className="text-green-500 font-medium flex items-center gap-1">
                                    <Check className="w-3.5 h-3.5" /> Token Configured
                                </span>
                            ) : (
                                <span>No token set (Using Public API)</span>
                            )}
                        </div>
                        <button 
                            onClick={handleSavePat}
                            className="bg-orange-600 hover:bg-orange-500 text-white px-5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md flex items-center gap-1"
                        >
                            {isPatSaved ? (
                                <>
                                    <Check className="w-3.5 h-3.5 animate-bounce" /> Saved!
                                </>
                            ) : (
                                'Save Token'
                            )}
                        </button>
                    </div>
                </div>
            </div>
            
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
                        disabled={!newRepoName || !newRepoUrl || isSyncing}
                        className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                        {isSyncing && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isSyncing ? (syncStatus || 'Fetching Apps...') : 'Add Repository'}
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
                                    <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded flex items-center gap-1">
                                        {repo.apps.length} apps
                                    </span>
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
                                className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors opacity-50 group-hover:opacity-100 focus:opacity-100"
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
              {syncStatus && !isSyncing && (
                  <p className="text-xs font-bold text-green-500 mb-2">{syncStatus}</p>
              )}
              <p className="text-[10px] text-slate-600">
                  Deploy Anywhere App Converter v1.6.3 •  by GlitchLab
              </p>
          </div>
        </div>
      </div>
    </>
  );
};