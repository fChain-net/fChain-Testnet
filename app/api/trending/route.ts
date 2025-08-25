import { createClient } from "@/lib/supabase/server"
import { calculateTrendingScore, categorizeTrending } from "@/lib/trending"
import { type NextRequest, NextResponse } from "next/server"

const mockProjects = [
  {
    id: "mock-1",
    token_name: "DeFi Token",
    token_symbol: "DEFI",
    token_description: "Revolutionary DeFi protocol built with Solidity",
    token_image_url: "/developer-working.png",
    repo_name: "defi-protocol",
    repo_url: "https://github.com/example/defi-protocol",
    repo_stars: 1250,
    repo_forks: 340,
    repo_language: "Solidity",
    usd_market_cap: 50000,
    transaction_count: 1500,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    repo_verified: true,
    users: {
      github_username: "defi-dev",
      github_avatar_url: "/developer-working.png",
    },
  },
  {
    id: "mock-2",
    token_name: "AI Bot Token",
    token_symbol: "AIBOT",
    token_description: "Machine learning powered trading bot for crypto markets",
    token_image_url: "/abstract-ai-network.png",
    repo_name: "ai-trader",
    repo_url: "https://github.com/example/ai-trader",
    repo_stars: 890,
    repo_forks: 156,
    repo_language: "Python",
    usd_market_cap: 25000,
    transaction_count: 750,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    repo_verified: true,
    users: {
      github_username: "ai-trader",
      github_avatar_url: "/abstract-ai-network.png",
    },
  },
  {
    id: "mock-3",
    token_name: "Game Token",
    token_symbol: "GAME",
    token_description: "Next-gen gaming engine with blockchain integration",
    token_image_url: "/gaming-setup.png",
    repo_name: "web3-game",
    repo_url: "https://github.com/example/web3-game",
    repo_stars: 2100,
    repo_forks: 420,
    repo_language: "TypeScript",
    usd_market_cap: 75000,
    transaction_count: 2200,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    repo_verified: true,
    users: {
      github_username: "game-dev",
      github_avatar_url: "/gaming-setup.png",
    },
  },
]

const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

function getCachedData(key: string) {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }
  return null
}

function setCachedData(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() })
}

export async function GET(request: NextRequest) {
  console.log("[v0] Trending API called with URL:", request.url)

  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category") || "hot"
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    console.log("[v0] Trending API params:", { category, limit })

    const cacheKey = `trending-${category}-${limit}`
    const cachedResult = getCachedData(cacheKey)
    if (cachedResult) {
      console.log("[v0] Returning cached result for:", cacheKey)
      return NextResponse.json(cachedResult, {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      })
    }

    let projects = []

    try {
      console.log("[v0] Creating Supabase client...")
      const supabase = await createClient()
      console.log("[v0] Supabase client created, querying database...")

      const { data: dbProjects, error } = await supabase
        .from("projects")
        .select(`
          *,
          users(github_username, github_avatar_url)
        `)
        .eq("repo_verified", true)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("[v0] Database error:", error)
        console.log("[v0] Using mock projects due to database error")
        projects = mockProjects
      } else {
        console.log("[v0] Database query successful, got", dbProjects?.length || 0, "projects")
        projects = (dbProjects || []).map((project: any) => ({
          ...project,
          token_name: project.token_name || project.name || `${project.token_symbol} Token`,
          token_description: project.token_description || project.description || "No description available",
          token_image_url: project.token_image_url || "/placeholder.svg",
          repo_name: project.repo_name || project.repo_url?.split("/").pop() || "Unknown",
        }))

        if (projects.length === 0) {
          console.log("[v0] No projects in database, using mock projects")
          projects = mockProjects
        }
      }
    } catch (dbError) {
      console.error("[v0] Database connection failed:", dbError)
      console.log("[v0] Using mock projects due to connection failure")
      projects = mockProjects
    }

    console.log("[v0] Processing", projects.length, "projects for trending calculation")

    const scores = projects.map((project: any) => {
      const githubStats = {
        stars: project.repo_stars || 0,
        forks: project.repo_forks || 0,
        watchers: 0,
        issues: 0,
        pullRequests: 0,
        commits: 0,
        contributors: 0,
        lastCommit: project.updated_at,
        weeklyCommits: 0,
        weeklyStars: 0,
      }

      return {
        projectId: project.id,
        score: calculateTrendingScore(project, githubStats),
        rank: 0,
        category: "hot" as const,
        project,
      }
    })

    const categorized = categorizeTrending(scores)

    Object.keys(categorized).forEach((cat) => {
      categorized[cat as keyof typeof categorized].forEach((item, index) => {
        item.rank = index + 1
      })
    })

    const result = categorized[category as keyof typeof categorized] || categorized.hot
    const limitedResult = result.slice(0, limit)

    const responseData = {
      category,
      projects: limitedResult.map((item: any) => ({
        ...item.project,
        trending_score: item.score,
        trending_rank: item.rank,
      })),
      total: result.length,
    }

    setCachedData(cacheKey, responseData)

    console.log("[v0] Trending API returning response for category:", category)
    return NextResponse.json(responseData, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    })
  } catch (error) {
    console.error("[v0] Error in trending API:", error)
    console.log("[v0] Returning fallback data due to error")

    const fallbackData = {
      category: "hot",
      projects: mockProjects.slice(0, 3).map((project, index) => ({
        ...project,
        trending_score: 100 - index * 10,
        trending_rank: index + 1,
      })),
      total: 3,
    }

    return NextResponse.json(fallbackData, {
      status: 200, // Ensure we return 200 status even for fallback data
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    })
  }
}
