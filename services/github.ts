
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
        let branch = 'master'; // Default to master/main usually, but we might need to detect it.

        // If the URL is like /owner/repo/tree/branch
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
 * Uses the GitHub API.
 */
export const fetchRepoContents = async (owner: string, repo: string, path: string = ''): Promise<GitHubContentItem[]> => {
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
        throw new Error(`Failed to fetch GitHub contents: ${response.statusText}`);
    }

    return response.json();
};

/**
 * Constructs a raw URL for a file in a GitHub repo.
 */
export const getRawUrl = (owner: string, repo: string, branch: string, path: string): string => {
    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
};
