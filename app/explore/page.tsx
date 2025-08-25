import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import Link from "next/link"
import { Github, Star, GitFork, ExternalLink, TrendingUp, Search } from "lucide-react"
import { ProjectFilters } from "@/components/project-filters"

interface SearchParams {
  search?: string
  language?: string
  sort?: string
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = await createClient()

  // Build query based on search params
  let query = supabase
    .from("projects")
    .select(`
      id,
      token_name,
      token_symbol,
      token_description,
      token_image_url,
      github_repo_url,
      repo_name,
      repo_description,
      repo_stars,
      repo_forks,
      repo_language,
      repo_verified,
      market_cap,
      usd_market_cap,
      pump_fun_url,
      created_at,
      users!inner(github_username, github_avatar_url)
    `)
    .eq("repo_verified", true)

  // Apply search filter
  if (searchParams.search) {
    query = query.or(
      `token_name.ilike.%${searchParams.search}%,token_symbol.ilike.%${searchParams.search}%,repo_name.ilike.%${searchParams.search}%`,
    )
  }

  // Apply language filter
  if (searchParams.language && searchParams.language !== "all") {
    query = query.eq("repo_language", searchParams.language)
  }

  // Apply sorting
  switch (searchParams.sort) {
    case "market_cap":
      query = query.order("market_cap", { ascending: false, nullsFirst: false })
      break
    case "stars":
      query = query.order("repo_stars", { ascending: false })
      break
    case "newest":
      query = query.order("created_at", { ascending: false })
      break
    default:
      query = query.order("created_at", { ascending: false })
  }

  const { data: projects, error } = await query.limit(50)

  if (error) {
    console.error("Error fetching projects:", error)
  }

  // Get unique languages for filter
  const { data: languages } = await supabase
    .from("projects")
    .select("repo_language")
    .not("repo_language", "is", null)
    .eq("repo_verified", true)

  const uniqueLanguages = [...new Set(languages?.map((l) => l.repo_language))].filter(Boolean).sort()

  return (
    <div className="min-h-screen bg-background">
      <Header showAuthButtons={false} />

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Explore Projects</h1>
          <p className="text-muted-foreground">Discover GitHub-linked tokens created by developers worldwide</p>
        </div>

        {/* Filters */}
        <ProjectFilters languages={uniqueLanguages} />

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{projects?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Active Projects</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{uniqueLanguages.length}</div>
              <p className="text-xs text-muted-foreground">Languages</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {projects?.reduce((sum, p) => sum + (p.repo_stars || 0), 0).toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground">Total Stars</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                $
                {projects
                  ?.reduce((sum, p) => sum + (p.usd_market_cap || 0), 0)
                  .toLocaleString(undefined, { maximumFractionDigits: 0 }) || 0}
              </div>
              <p className="text-xs text-muted-foreground">Total Market Cap</p>
            </CardContent>
          </Card>
        </div>

        {/* Projects Grid */}
        {projects && projects.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project: any) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    {project.users?.github_avatar_url && (
                      <img
                        src={project.users.github_avatar_url || "/placeholder.svg"}
                        alt={project.users.github_username}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <Link
                      href={`/user/${project.users?.github_username}`}
                      className="text-sm text-muted-foreground hover:text-primary"
                    >
                      @{project.users?.github_username}
                    </Link>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    {project.token_image_url && (
                      <img
                        src={project.token_image_url || "/placeholder.svg"}
                        alt={project.token_name}
                        className="w-8 h-8 rounded"
                      />
                    )}
                    <CardTitle className="text-lg">${project.token_symbol}</CardTitle>
                    {project.repo_verified && (
                      <Badge variant="secondary" className="text-xs">
                        Verified
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="line-clamp-2">{project.token_description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Repository Info */}
                  <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                    <Github className="h-4 w-4" />
                    <span className="truncate">{project.repo_name}</span>
                    {project.repo_language && (
                      <Badge variant="outline" className="text-xs">
                        {project.repo_language}
                      </Badge>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      {project.repo_stars}
                    </div>
                    <div className="flex items-center gap-1">
                      <GitFork className="h-3 w-3" />
                      {project.repo_forks}
                    </div>
                    {project.usd_market_cap && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />${project.usd_market_cap.toLocaleString()}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link href={`/project/${project.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full bg-transparent">
                        View Project
                      </Button>
                    </Link>
                    {project.pump_fun_url && (
                      <Link href={project.pump_fun_url} target="_blank">
                        <Button size="sm" variant="ghost">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No projects found</h3>
            <p className="text-muted-foreground mb-4">Try adjusting your search or filters</p>
            <Link href="/launch">
              <Button>Launch the First Project</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
