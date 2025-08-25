// GitHub API utilities
export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  stargazers_count: number
  forks_count: number
  language: string | null
  owner: {
    login: string
    avatar_url: string
  }
  created_at: string
  updated_at: string
  topics: string[]
}

export async function fetchUserRepos(accessToken: string): Promise<GitHubRepo[]> {
  const response = await fetch("https://api.github.com/user/repos?sort=updated&per_page=100", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
    },
  })

  if (!response.ok) {
    throw new Error("Failed to fetch repositories")
  }

  return response.json()
}

export async function fetchRepoDetails(owner: string, repo: string, accessToken: string): Promise<GitHubRepo> {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
    },
  })

  if (!response.ok) {
    throw new Error("Failed to fetch repository details")
  }

  return response.json()
}

export async function verifyRepoOwnership(owner: string, repo: string, accessToken: string): Promise<boolean> {
  try {
    // Check if user can access the repo and has push permissions
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    })

    if (!response.ok) {
      return false
    }

    const repoData = await response.json()

    // Check if user has admin or push permissions
    return repoData.permissions?.admin || repoData.permissions?.push || false
  } catch (error) {
    console.error("Error verifying repo ownership:", error)
    return false
  }
}
