import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Header } from "@/components/header"
import Link from "next/link"
import { Github, Star, GitFork, ExternalLink, Calendar, TrendingUp, ArrowLeft } from "lucide-react"
import { TradingInterface } from "@/components/trading-interface"

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  // Fetch project details
  const { data: project, error } = await supabase
    .from("projects")
    .select(`
      *,
      users!inner(github_username, github_avatar_url),
      transactions(
        id,
        transaction_type,
        sol_amount,
        token_amount,
        created_at,
        status
      )
    `)
    .eq("id", params.id)
    .single()

  if (error || !project) {
    notFound()
  }

  // Get recent transactions for this project
  const { data: recentTransactions } = await supabase
    .from("transactions")
    .select(`
      *,
      users!inner(github_username, github_avatar_url)
    `)
    .eq("project_id", params.id)
    .order("created_at", { ascending: false })
    .limit(10)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    {project.token_image_url && (
                      <img
                        src={project.token_image_url || "/placeholder.svg"}
                        alt={project.token_name}
                        className="w-16 h-16 rounded-lg border"
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h1 className="text-3xl font-bold">${project.token_symbol}</h1>
                        {project.repo_verified && <Badge variant="secondary">Verified</Badge>}
                      </div>
                      <h2 className="text-xl text-muted-foreground mb-2">{project.token_name}</h2>
                      <div className="flex items-center gap-3">
                        {project.users?.github_avatar_url && (
                          <img
                            src={project.users.github_avatar_url || "/placeholder.svg"}
                            alt={project.users.github_username}
                            className="w-6 h-6 rounded-full"
                          />
                        )}
                        <Link
                          href={`/user/${project.users?.github_username}`}
                          className="text-sm text-muted-foreground hover:text-primary"
                        >
                          @{project.users?.github_username}
                        </Link>
                        <span className="text-muted-foreground">•</span>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(project.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {project.pump_fun_url && (
                      <Link href={project.pump_fun_url} target="_blank">
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Pump.fun
                        </Button>
                      </Link>
                    )}
                    <Link href={project.github_repo_url} target="_blank">
                      <Button variant="outline" size="sm">
                        <Github className="h-4 w-4 mr-2" />
                        GitHub
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{project.token_description}</p>

                {/* Token Stats */}
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-lg font-bold">
                      {project.market_cap ? `$${project.market_cap.toLocaleString()}` : "N/A"}
                    </div>
                    <div className="text-xs text-muted-foreground">Market Cap</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-lg font-bold">{project.repo_stars}</div>
                    <div className="text-xs text-muted-foreground">GitHub Stars</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-lg font-bold">{project.repo_forks}</div>
                    <div className="text-xs text-muted-foreground">GitHub Forks</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-lg font-bold">{project.transactions?.length || 0}</div>
                    <div className="text-xs text-muted-foreground">Transactions</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Repository Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Github className="h-5 w-5" />
                  Repository Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-1">{project.repo_name}</h3>
                    <p className="text-sm text-muted-foreground">{project.repo_description}</p>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    {project.repo_language && <Badge variant="outline">{project.repo_language}</Badge>}
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4" />
                      {project.repo_stars} stars
                    </div>
                    <div className="flex items-center gap-1">
                      <GitFork className="h-4 w-4" />
                      {project.repo_forks} forks
                    </div>
                  </div>

                  <Link href={project.github_repo_url} target="_blank">
                    <Button variant="outline" className="w-full bg-transparent">
                      <Github className="h-4 w-4 mr-2" />
                      View on GitHub
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest transactions for this token</CardDescription>
              </CardHeader>
              <CardContent>
                {recentTransactions && recentTransactions.length > 0 ? (
                  <div className="space-y-3">
                    {recentTransactions.map((tx: any) => (
                      <div key={tx.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {tx.users?.github_avatar_url && (
                            <img
                              src={tx.users.github_avatar_url || "/placeholder.svg"}
                              alt={tx.users.github_username}
                              className="w-8 h-8 rounded-full"
                            />
                          )}
                          <div>
                            <div className="font-medium capitalize">{tx.transaction_type}</div>
                            <div className="text-sm text-muted-foreground">
                              @{tx.users?.github_username} • {tx.sol_amount} SOL
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={
                              tx.status === "confirmed"
                                ? "default"
                                : tx.status === "failed"
                                  ? "destructive"
                                  : "secondary"
                            }
                            className="text-xs"
                          >
                            {tx.status}
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(tx.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No transactions yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trading Interface */}
            <TradingInterface project={project} />

            {/* Token Info */}
            <Card>
              <CardHeader>
                <CardTitle>Token Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Contract Address</span>
                  <span className="font-mono text-xs">
                    {project.mint_address
                      ? `${project.mint_address.slice(0, 6)}...${project.mint_address.slice(-4)}`
                      : "N/A"}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Bonding Curve</span>
                  <span className="font-mono text-xs">
                    {project.bonding_curve_address
                      ? `${project.bonding_curve_address.slice(0, 6)}...${project.bonding_curve_address.slice(-4)}`
                      : "N/A"}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Created</span>
                  <span>{new Date(project.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
