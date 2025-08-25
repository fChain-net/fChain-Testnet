import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get all verified projects that need stats updates
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("*")
      .eq("repo_verified", true)
      .lt("updated_at", new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Updated more than 1 hour ago

    if (projectsError) {
      throw new Error("Failed to fetch projects")
    }

    const updates = []

    for (const project of projects || []) {
      try {
        // Parse GitHub URL to get owner and repo
        const urlMatch = project.github_repo_url.match(/github\.com\/([^/]+)\/([^/]+)/)
        if (!urlMatch) continue

        const [, owner, repo] = urlMatch

        // Fetch updated repository stats from GitHub API
        const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
          headers: {
            Accept: "application/vnd.github.v3+json",
            // In production, you'd use a GitHub token for higher rate limits
            // Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          },
        })

        if (!repoResponse.ok) continue

        const repoData = await repoResponse.json()

        // Fetch commit activity (last week)
        const commitsResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/stats/commit_activity`, {
          headers: {
            Accept: "application/vnd.github.v3+json",
          },
        })

        let weeklyCommits = 0
        if (commitsResponse.ok) {
          const commitsData = await commitsResponse.json()
          if (Array.isArray(commitsData) && commitsData.length > 0) {
            weeklyCommits = commitsData[commitsData.length - 1]?.total || 0
          }
        }

        // Calculate weekly stars (approximation based on current stars vs stored stars)
        const weeklyStars = Math.max(0, repoData.stargazers_count - (project.repo_stars || 0))

        // Update project with new stats
        const updateData = {
          repo_stars: repoData.stargazers_count,
          repo_forks: repoData.forks_count,
          repo_description: repoData.description,
          repo_language: repoData.language,
          updated_at: new Date().toISOString(),
        }

        updates.push({
          id: project.id,
          ...updateData,
          weeklyStars,
          weeklyCommits,
        })

        // Update in database
        await supabase.from("projects").update(updateData).eq("id", project.id)

        // Add to GitHub stats history table
        await supabase.from("github_stats_history").insert({
          project_id: project.id,
          stars: repoData.stargazers_count,
          forks: repoData.forks_count,
          weekly_stars: weeklyStars,
          weekly_commits: weeklyCommits,
          recorded_at: new Date().toISOString(),
        })

        // Rate limiting - wait between requests
        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (error) {
        console.error(`Error updating stats for project ${project.id}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      updated: updates.length,
      projects: updates,
    })
  } catch (error) {
    console.error("Error updating GitHub stats:", error)
    return NextResponse.json({ error: "Failed to update GitHub stats" }, { status: 500 })
  }
}
