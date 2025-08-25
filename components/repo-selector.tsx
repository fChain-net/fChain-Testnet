"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Github, Star, GitFork, ExternalLink, Check, Loader2 } from "lucide-react"
import type { GitHubRepo } from "@/lib/github"

interface RepoSelectorProps {
  onRepoSelected: (repoData: any) => void
  selectedRepo?: string
}

export function RepoSelector({ onRepoSelected, selectedRepo }: RepoSelectorProps) {
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [customRepoUrl, setCustomRepoUrl] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUserRepos()
  }, [])

  const fetchUserRepos = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/github/repos")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch repositories")
      }

      setRepos(data.repos)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to fetch repositories")
    } finally {
      setLoading(false)
    }
  }

  const verifyRepository = async (repoUrl: string) => {
    setVerifying(true)
    setError(null)

    try {
      const response = await fetch("/api/github/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ repoUrl }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify repository")
      }

      onRepoSelected({
        url: repoUrl,
        verified: true,
        ...data.repoDetails,
        projectId: data.project?.id,
      })
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to verify repository")
    } finally {
      setVerifying(false)
    }
  }

  const handleCustomRepoSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (customRepoUrl.trim()) {
      verifyRepository(customRepoUrl.trim())
    }
  }

  return (
    <div className="space-y-6">
      {/* Custom Repository URL */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            Verify Repository
          </CardTitle>
          <CardDescription>Enter your GitHub repository URL to verify ownership and fetch details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCustomRepoSubmit} className="space-y-4">
            <div>
              <Label htmlFor="repo-url">Repository URL</Label>
              <Input
                id="repo-url"
                type="url"
                placeholder="https://github.com/username/repository"
                value={customRepoUrl}
                onChange={(e) => setCustomRepoUrl(e.target.value)}
                disabled={verifying}
              />
            </div>
            <Button type="submit" disabled={verifying || !customRepoUrl.trim()}>
              {verifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Verify Repository
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* Your Repositories */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Repositories</CardTitle>
              <CardDescription>Select from your GitHub repositories</CardDescription>
            </div>
            <Button variant="outline" onClick={fetchUserRepos} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md mb-4">{error}</div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : repos.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {repos.map((repo) => (
                <div
                  key={repo.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedRepo === repo.html_url ? "border-primary bg-primary/5" : ""
                  }`}
                  onClick={() => verifyRepository(repo.html_url)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{repo.name}</h3>
                        {repo.language && (
                          <Badge variant="secondary" className="text-xs">
                            {repo.language}
                          </Badge>
                        )}
                      </div>
                      {repo.description && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{repo.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {repo.stargazers_count}
                        </div>
                        <div className="flex items-center gap-1">
                          <GitFork className="h-3 w-3" />
                          {repo.forks_count}
                        </div>
                        <div>Updated {new Date(repo.updated_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedRepo === repo.html_url && <Check className="h-4 w-4 text-primary" />}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(repo.html_url, "_blank")
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Github className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No repositories found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Make sure you have public repositories in your GitHub account
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
