import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import Link from "next/link"
import { Github, Star, GitFork, ExternalLink, Calendar, ArrowLeft } from "lucide-react"

export default async function UserProfilePage({ params }: { params: { username: string } }) {
  const supabase = await createClient()

  // Fetch user profile
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("github_username", params.username)
    .single()

  if (userError || !user) {
    notFound()
  }

  // Fetch user's projects
  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user.id)
    .eq("repo_verified", true)
    .order("created_at", { ascending: false })

  const totalStars = projects?.reduce((sum, p) => sum + (p.repo_stars || 0), 0) || 0
  const totalMarketCap = projects?.reduce((sum, p) => sum + (p.usd_market_cap || 0), 0) || 0

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/explore">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Explore
              </Button>
            </Link>
            <Header showAuthButtons={false} />
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
            <Link href="/launch">
              <Button>Launch Token</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-start gap-6">
              {user.github_avatar_url && (
                <img
                  src={user.github_avatar_url || "/placeholder.svg"}
                  alt={user.github_username}
                  className="w-24 h-24 rounded-full border-2 border-border"
                />
              )}
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">@{user.github_username}</h1>
                <div className="flex items-center gap-4 text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Joined {new Date(user.created_at).toLocaleDateString()}
                  </div>
                  {user.wallet_address && <Badge variant="secondary">Wallet Connected</Badge>}
                </div>

                {/* Stats */}
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-lg font-bold">{projects?.length || 0}</div>
                    <div className="text-xs text-muted-foreground">Projects</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-lg font-bold">{totalStars.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Total Stars</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-lg font-bold">
                      ${totalMarketCap.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                    <div className="text-xs text-muted-foreground">Total Market Cap</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-lg font-bold">{projects?.filter((p) => p.mint_address).length || 0}</div>
                    <div className="text-xs text-muted-foreground">Live Tokens</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Projects */}
        <Card>
          <CardHeader>
            <CardTitle>Projects by @{user.github_username}</CardTitle>
            <CardDescription>GitHub-linked tokens created by this developer</CardDescription>
          </CardHeader>
          <CardContent>
            {projects && projects.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => (
                  <Card key={project.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2 mb-2">
                        {project.token_image_url && (
                          <img
                            src={project.token_image_url || "/placeholder.svg"}
                            alt={project.token_name}
                            className="w-6 h-6 rounded"
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
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                        <Github className="h-4 w-4" />
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
                <Github className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No projects yet</h3>
                <p className="text-muted-foreground">This developer hasn't launched any tokens yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
