// Trending algorithm and GitHub stats utilities
export interface TrendingScore {
  projectId: string
  score: number
  rank: number
  category: "hot" | "rising" | "top"
}

export interface GitHubStats {
  stars: number
  forks: number
  watchers: number
  issues: number
  pullRequests: number
  commits: number
  contributors: number
  lastCommit: string
  weeklyCommits: number
  weeklyStars: number
}

// Calculate trending score based on multiple factors
export function calculateTrendingScore(project: any, githubStats: GitHubStats): number {
  const now = Date.now()
  const createdAt = new Date(project.created_at).getTime()
  const ageInDays = (now - createdAt) / (1000 * 60 * 60 * 24)

  // Base scores
  const starsScore = Math.log(githubStats.stars + 1) * 10
  const forksScore = Math.log(githubStats.forks + 1) * 8
  const marketCapScore = Math.log((project.usd_market_cap || 0) + 1) * 5
  const transactionScore = Math.log((project.transaction_count || 0) + 1) * 12

  // Recent activity multipliers
  const weeklyStarsMultiplier = githubStats.weeklyStars > 0 ? Math.log(githubStats.weeklyStars + 1) * 15 : 0
  const weeklyCommitsMultiplier = githubStats.weeklyCommits > 0 ? Math.log(githubStats.weeklyCommits + 1) * 8 : 0

  // Age penalty (newer projects get slight boost, very old projects get penalty)
  const agePenalty = ageInDays > 30 ? Math.log(ageInDays / 30) * -2 : ageInDays < 7 ? 5 : 0

  // Language popularity bonus
  const languageBonus = getLanguagePopularityBonus(project.repo_language)

  const totalScore =
    starsScore +
    forksScore +
    marketCapScore +
    transactionScore +
    weeklyStarsMultiplier +
    weeklyCommitsMultiplier +
    agePenalty +
    languageBonus

  return Math.max(0, totalScore)
}

function getLanguagePopularityBonus(language: string | null): number {
  const popularLanguages: Record<string, number> = {
    JavaScript: 8,
    TypeScript: 10,
    Python: 9,
    Java: 7,
    Go: 8,
    Rust: 12,
    "C++": 6,
    C: 5,
    PHP: 4,
    Ruby: 5,
    Swift: 7,
    Kotlin: 6,
    Dart: 5,
    Solidity: 15, // Crypto bonus
  }

  return popularLanguages[language || ""] || 0
}

// Categorize projects into trending categories
export function categorizeTrending(scores: TrendingScore[]): {
  hot: TrendingScore[]
  rising: TrendingScore[]
  top: TrendingScore[]
} {
  const sorted = scores.sort((a, b) => b.score - a.score)

  return {
    hot: sorted.slice(0, 10), // Top 10 overall
    rising: sorted.filter((_, i) => i >= 10 && i < 25), // Next 15
    top: sorted.slice(0, 50), // Top 50 for leaderboard
  }
}
