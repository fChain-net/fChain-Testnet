"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { TrendingUp, Flame, Rocket, Trophy, Star, GitFork } from "lucide-react"

interface TrendingProject {
  id: string
  token_name: string
  token_symbol: string
  token_description: string
  token_image_url: string
  repo_name: string
  repo_stars: number
  repo_forks: number
  repo_language: string
  usd_market_cap: number
  trending_score: number
  trending_rank: number
  users: {
    github_username: string
    github_avatar_url: string
  }
}

export function TrendingSection() {
  const [trendingProjects, setTrendingProjects] = useState<{
    hot: TrendingProject[]
    rising: TrendingProject[]
    top: TrendingProject[]
  }>({
    hot: [],
    rising: [],
    top: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("hot")

  useEffect(() => {
    fetchTrendingProjects()
  }, [])

  const fetchTrendingProjects = async () => {
    setLoading(true)
    setError(null)
    try {
      const [hotResponse, risingResponse, topResponse] = await Promise.all([
        fetch("/api/trending?category=hot&limit=6"),
        fetch("/api/trending?category=rising&limit=6"),
        fetch("/api/trending?category=top&limit=10"),
      ])

      if (!hotResponse.ok || !risingResponse.ok || !topResponse.ok) {
        throw new Error("Failed to fetch trending projects")
      }

      const [hotData, risingData, topData] = await Promise.all([
        hotResponse.json(),
        risingResponse.json(),
        topResponse.json(),
      ])

      setTrendingProjects({
        hot: hotData.projects || [],
        rising: risingData.projects || [],
        top: topData.projects || [],
      })
    } catch (error) {
      console.error("Error fetching trending projects:", error)
      setError("Failed to load trending projects. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const renderProjectCard = (project: TrendingProject, showRank = false) => (
    <Card key={project.id} className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {showRank && (
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                #{project.trending_rank}
              </div>
            )}
            <div className="flex items-center gap-2">
              {project.users?.github_avatar_url && (
                <img
                  src={project.users.github_avatar_url || "/placeholder.svg"}
                  alt={project.users.github_username}
                  className="w-6 h-6 rounded-full"
                />
              )}
              <span className="text-sm text-muted-foreground">@{project.users?.github_username}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3" />
            {Math.round(project.trending_score)}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {project.token_image_url && (
            <img
              src={project.token_image_url || "/placeholder.svg"}
              alt={project.token_name}
              className="w-8 h-8 rounded"
            />
          )}
          <CardTitle className="text-lg">${project.token_symbol}</CardTitle>
          <Badge variant="secondary" className="text-xs">
            Trending
          </Badge>
        </div>
        <CardDescription className="line-clamp-2">{project.token_description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
          <span className="truncate">{project.repo_name}</span>
          {project.repo_language && (
            <Badge variant="outline" className="text-xs">
              {project.repo_language}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3" />
            {project.repo_stars}
          </div>
          <div className="flex items-center gap-1">
            <GitFork className="h-3 w-3" />
            {project.repo_forks}
          </div>
          {project.usd_market_cap && <div>${project.usd_market_cap.toLocaleString()}</div>}
        </div>

        <Link href={`/project/${project.id}`}>
          <Button variant="outline" size="sm" className="w-full bg-transparent">
            View Project
          </Button>
        </Link>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Trending Projects</h2>
            <p className="text-muted-foreground">Discover the hottest GitHub-linked tokens</p>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">{error}</div>
          <Button onClick={fetchTrendingProjects} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Trending Projects</h2>
          <p className="text-muted-foreground">Discover the hottest GitHub-linked tokens</p>
        </div>
        <Button variant="outline" onClick={fetchTrendingProjects}>
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="hot" className="flex items-center gap-2">
            <Flame className="h-4 w-4" />
            Hot
          </TabsTrigger>
          <TabsTrigger value="rising" className="flex items-center gap-2">
            <Rocket className="h-4 w-4" />
            Rising
          </TabsTrigger>
          <TabsTrigger value="top" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Top
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hot" className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trendingProjects.hot.map((project) => renderProjectCard(project))}
          </div>
          {trendingProjects.hot.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">No trending projects found</div>
          )}
        </TabsContent>

        <TabsContent value="rising" className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trendingProjects.rising.map((project) => renderProjectCard(project))}
          </div>
          {trendingProjects.rising.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">No rising projects found</div>
          )}
        </TabsContent>

        <TabsContent value="top" className="space-y-4">
          <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-4">
            {trendingProjects.top.map((project) => renderProjectCard(project, true))}
          </div>
          {trendingProjects.top.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">No top projects found</div>
          )}
        </TabsContent>
      </Tabs>

      <div className="text-center">
        <Link href="/explore">
          <Button variant="outline">View All Projects</Button>
        </Link>
      </div>
    </div>
  )
}
