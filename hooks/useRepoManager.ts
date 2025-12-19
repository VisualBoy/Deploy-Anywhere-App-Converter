import { useState, useEffect, useCallback } from 'react';
import { Repo } from '../types';
import { fetchAppsFromUrl } from '../services/repository';
import { loadReposFromStorage, saveReposToStorage } from '../services/storage';

const CACHE_VALIDITY_MS = 24 * 60 * 60 * 1000; // 24 hours

export const useRepoManager = () => {
    const [repositories, setRepositories] = useState<Repo[]>(loadReposFromStorage);
    const [isSyncingGlobal, setIsSyncingGlobal] = useState(false);
    const [syncStatus, setSyncStatus] = useState<string>('');

    // Persist Repositories whenever they change
    useEffect(() => {
        saveReposToStorage(repositories);
    }, [repositories]);

    const handleSyncRepos = useCallback(async (force: boolean = false) => {
        setIsSyncingGlobal(true);
        const now = Date.now();
        try {
            const updatedRepos: Repo[] = [];
            
            for (const repo of repositories) {
                if (!repo.url) {
                    updatedRepos.push(repo);
                    continue;
                }
                
                const isExpired = !repo.lastSynced || (now - repo.lastSynced > CACHE_VALIDITY_MS);
                
                // Skip if not forced, cache is valid, and we have data
                if (!force && !isExpired && repo.apps.length > 0) {
                    updatedRepos.push(repo);
                    continue;
                }

                setSyncStatus(`Syncing ${repo.name}...`);
                try {
                    const apps = await fetchAppsFromUrl(repo.url);
                    updatedRepos.push({ ...repo, apps, lastSynced: now });
                } catch (e) {
                    console.warn(`Failed to sync repo ${repo.name}:`, e);
                    updatedRepos.push({ ...repo, lastSynced: now }); 
                }
            }
            
            setRepositories(updatedRepos);
            setSyncStatus('Sync complete!');
            setTimeout(() => setSyncStatus(''), 3000);
        } finally {
            setIsSyncingGlobal(false);
        }
    }, [repositories]);

    const handleAddRepo = async (name: string, url: string) => {
        setIsSyncingGlobal(true);
        setSyncStatus(`Adding ${name}...`);
        try {
            const apps = await fetchAppsFromUrl(url);
            const newRepo: Repo = {
                id: `custom-${Date.now()}`,
                name: name,
                url: url,
                apps: apps,
                lastSynced: Date.now()
            };
            setRepositories(prev => [...prev, newRepo]);
            setSyncStatus('Repository added!');
            setTimeout(() => setSyncStatus(''), 2000);
        } catch (error) {
            console.error("Error adding repository:", error);
            setSyncStatus('Add failed');
            alert(`Failed to fetch apps from repository. Please check the URL.\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsSyncingGlobal(false);
        }
    };

    const handleRemoveRepo = (id: string) => {
        setRepositories(prev => prev.filter(r => r.id !== id));
    };

    // Auto-sync on mount
    useEffect(() => {
        const needsSync = repositories.some(r => {
            if (!r.url) return false;
            return !r.lastSynced || (Date.now() - r.lastSynced > CACHE_VALIDITY_MS);
        });

        if (needsSync) {
            handleSyncRepos(false);
        }
    }, []);

    return {
        repositories,
        isSyncingGlobal,
        syncStatus,
        syncRepos: handleSyncRepos,
        addRepo: handleAddRepo,
        removeRepo: handleRemoveRepo
    };
};
