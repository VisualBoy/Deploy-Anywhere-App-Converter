/**
 * Extracts owner and repo from a GitHub URL.
 * Supports:
 * - https://github.com/owner/repo
 * - https://github.com/owner/repo/tree/branch/...
 */
export const parseGitHubUrl = (url: string): { owner: string; repo: string; branch?: string } | null => {
    try {
        const u = new URL(url);
        if (u.hostname !== 'github.com') return null;

        const parts = u.pathname.split('/').filter(Boolean);
        if (parts.length < 2) return null;

        const owner = parts[0];
        const repo = parts[1];
        let branch = 'master'; 

        if (parts.length >= 4 && parts[2] === 'tree') {
            branch = parts[3];
        }

        return { owner, repo, branch };
    } catch (e) {
        return null;
    }
};

interface GitHubContentItem {
    name: string;
    path: string;
    sha: string;
    size: number;
    url: string;
    html_url: string;
    git_url: string;
    download_url: string | null;
    type: 'file' | 'dir';
}

const apiCache = new Map<string, any>();
let lastActivePat = typeof window !== 'undefined' ? (localStorage.getItem('app-converter-github-pat') || '') : '';

const isRateLimited = (): boolean => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('github-rate-limit-exceeded') === 'true';
};

const getGitHubHeaders = (): HeadersInit => {
    const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
    };
    if (typeof window !== 'undefined') {
        const pat = localStorage.getItem('app-converter-github-pat');
        if (pat && pat.trim()) {
            const token = pat.trim();
            headers['Authorization'] = token.startsWith('token ') || token.startsWith('Bearer ') ? token : `token ${token}`;
        }
    }
    return headers;
};

const cachedFetch = async (url: string, bypassCache: boolean = false): Promise<any> => {
    if (isRateLimited()) {
        throw new Error("GitHub API rate limit exceeded. Provide a GitHub PAT in Settings to lift this limit.");
    }

    if (typeof window !== 'undefined') {
        const currentPat = localStorage.getItem('app-converter-github-pat') || '';
        if (currentPat !== lastActivePat) {
            apiCache.clear();
            lastActivePat = currentPat;
        }
    }

    if (!bypassCache && apiCache.has(url)) {
        return apiCache.get(url);
    }

    try {
        const response = await fetch(url, {
            headers: getGitHubHeaders()
        });

        if (!response.ok) {
            if (response.status === 403) {
                if (typeof window !== 'undefined') {
                    sessionStorage.setItem('github-rate-limit-exceeded', 'true');
                }
                throw new Error("GitHub API rate limit exceeded. Provide a GitHub PAT in Settings to lift this limit.");
            }
            throw new Error(`GitHub API error: ${response.statusText} (${response.status})`);
        }

        const data = await response.json();
        apiCache.set(url, data);
        return data;
    } catch (error) {
        throw error;
    }
};

/**
 * Fetches the contents of a path in a GitHub repository.
 */
export const fetchRepoContents = async (owner: string, repo: string, path: string = '', bypassCache: boolean = false): Promise<GitHubContentItem[]> => {
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    return cachedFetch(apiUrl, bypassCache);
};

/**
 * Fetches the entire repository tree recursively in one call.
 * This is much more efficient than navigating directory by directory.
 */
export const fetchRecursiveRepoTree = async (owner: string, repo: string, branch: string = 'master', bypassCache: boolean = false): Promise<{ path: string; type: string }[]> => {
    // Note: Recursive tree might fail for very large repos, but works for most appstores.
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
    try {
        const data = await cachedFetch(apiUrl, bypassCache);
        return data.tree || [];
    } catch (e: any) {
        if (e.message && e.message.includes('rate limit')) {
            throw e;
        }
        // Fallback to non-recursive if branch name is different (e.g. main vs master)
        if (branch === 'master') {
            return fetchRecursiveRepoTree(owner, repo, 'main', bypassCache);
        }
        throw e;
    }
};

/**
 * Constructs a raw URL for a file in a GitHub repo.
 * Raw URLs are not rate-limited like the API.
 */
export const getRawUrl = (owner: string, repo: string, branch: string, path: string): string => {
    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
};