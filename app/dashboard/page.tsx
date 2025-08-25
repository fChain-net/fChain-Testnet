import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/header"
import Link from "next/link"
import { Plus, Rocket, TrendingUp, Wallet, ExternalLink } from "lucide-react"

async function signOut() {
  "use server"
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/")
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single()

  // Get user's projects
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  // Get user's transactions
  const { data: transactions } = await supabase
    .from("transactions")
    .select(`
      *,
      projects!inner(token_name, token_symbol)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Header user={user} showAuthButtons={false} />
          <div className="flex items-center gap-4">
            <Link href="/explore">
              <Button variant="ghost">Explore</Button>
            </Link>
            <Link href="/launch">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Launch Token
              </Button>
            </Link>
            <form action={signOut}>
              <Button variant="outline" type="submit">
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            {profile?.github_avatar_url && (
              <img
                src={profile.github_avatar_url || "/placeholder.svg"}
                alt="Profile"
                className="w-16 h-16 rounded-full border-2 border-border"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold">Welcome back, {profile?.github_username || "Developer"}!</h1>
              <p className="text-muted-foreground">Manage your token launches and track your GitHub-linked projects</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <Rocket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projects?.length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Tokens</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projects?.filter((p) => p.mint_address).length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transactions?.length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Wallet Connected</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                {profile?.wallet_address ? (
                  <Badge variant="secondary">Connected</Badge>
                ) : (
                  <Badge variant="outline">Not Connected</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Projects Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Your Projects</CardTitle>
                <Link href="/launch">
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    New Project
                  </Button>
                </Link>
              </div>
              <CardDescription>Manage your GitHub-linked token projects</CardDescription>
            </CardHeader>
            <CardContent>
              {projects && projects.length > 0 ? (
                <div className="space-y-4">
                  {projects.slice(0, 5).map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {project.token_image_url && (
                          <img
                            src={project.token_image_url || "/placeholder.svg"}
                            alt={project.token_name}
                            className="w-8 h-8 rounded"
                          />
                        )}
                        <div>
                          <div className="font-medium">${project.token_symbol}</div>
                          <div className="text-sm text-muted-foreground">{project.token_name}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {project.repo_verified && (
                          <Badge variant="secondary" className="text-xs">
                            Verified
                          </Badge>
                        )}
                        {project.mint_address ? (
                          <Badge className="text-xs">Live</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Draft
                          </Badge>
                        )}
                        {project.pump_fun_url && (
                          <Link href={project.pump_fun_url} target="_blank">
                            <Button size="sm" variant="ghost">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                  {projects.length > 5 && (
                    <div className="text-center pt-2">
                      <Button variant="outline" size="sm">
                        View All Projects ({projects.length})
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Rocket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No projects yet</p>
                  <Link href="/launch">
                    <Button>Launch Your First Token</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest transactions and activities</CardDescription>
            </CardHeader>
            <CardContent>
              {transactions && transactions.length > 0 ? (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium capitalize">{transaction.transaction_type}</div>
                        <div className="text-sm text-muted-foreground">
                          ${transaction.projects?.token_symbol} • {transaction.sol_amount} SOL
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            transaction.status === "confirmed"
                              ? "default"
                              : transaction.status === "failed"
                                ? "destructive"
                                : "secondary"
                          }
                          className="text-xs"
                        >
                          {transaction.status}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No transactions yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
