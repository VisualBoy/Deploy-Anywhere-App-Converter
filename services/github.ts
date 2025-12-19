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

/**
 * Fetches the contents of a path in a GitHub repository.
 */
export const fetchRepoContents = async (owner: string, repo: string, path: string = ''): Promise<GitHubContentItem[]> => {
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
        if (response.status === 403) {
            throw new Error("GitHub API rate limit exceeded. Please try again later or use a different repository.");
        }
        throw new Error(`Failed to fetch GitHub contents: ${response.statusText}`);
    }

    return response.json();
};

/**
 * Fetches the entire repository tree recursively in one call.
 * This is much more efficient than navigating directory by directory.
 */
export const fetchRecursiveRepoTree = async (owner: string, repo: string, branch: string = 'master'): Promise<{ path: string; type: string }[]> => {
    // Note: Recursive tree might fail for very large repos, but works for most appstores.
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
        if (response.status === 403) {
            throw new Error("GitHub API rate limit exceeded. Please try again later.");
        }
        // Fallback to non-recursive if branch name is different (e.g. main vs master)
        if (response.status === 404 && branch === 'master') {
            return fetchRecursiveRepoTree(owner, repo, 'main');
        }
        throw new Error(`Failed to fetch GitHub tree: ${response.statusText}`);
    }

    const data = await response.json();
    return data.tree || [];
};

/**
 * Constructs a raw URL for a file in a GitHub repo.
 * Raw URLs are not rate-limited like the API.
 */
export const getRawUrl = (owner: string, repo: string, branch: string, path: string): string => {
    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
};