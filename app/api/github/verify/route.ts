import { createClient } from "@/lib/supabase/server"
import { verifyRepoOwnership, fetchRepoDetails } from "@/lib/github"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Starting repository verification...")
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      console.log("[v0] Authentication error:", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.log("[v0] User authenticated:", user.id)

    const { repoUrl } = await request.json()
    console.log("[v0] Repository URL:", repoUrl)

    if (!repoUrl) {
      return NextResponse.json({ error: "Repository URL is required" }, { status: 400 })
    }

    const urlMatch = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/)
    if (!urlMatch) {
      console.log("[v0] Invalid GitHub URL format:", repoUrl)
      return NextResponse.json({ error: "Invalid GitHub repository URL" }, { status: 400 })
    }

    const [, owner, repoName] = urlMatch
    console.log("[v0] Parsed repo:", { owner, repoName })

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.log("[v0] Session error:", sessionError)
      return NextResponse.json({ error: "Failed to get session" }, { status: 500 })
    }

    console.log("[v0] Session data:", {
      hasSession: !!session,
      provider: session?.provider,
      hasProviderToken: !!session?.provider_token,
    })

    let accessToken = session?.provider_token

    if (!accessToken && user.user_metadata?.github_access_token) {
      console.log("[v0] Using GitHub token from user metadata")
      accessToken = user.user_metadata.github_access_token
    }

    if (!accessToken) {
      console.log("[v0] No GitHub access token found")
      return NextResponse.json(
        { error: "GitHub access token not found. Please sign out and sign in again with GitHub." },
        { status: 400 },
      )
    }
    console.log("[v0] GitHub access token found, length:", accessToken.length)

    try {
      console.log("[v0] Verifying repository ownership...")
      const isOwner = await Promise.race([
        verifyRepoOwnership(owner, repoName, accessToken),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000)),
      ])

      if (!isOwner) {
        console.log("[v0] Repository ownership verification failed")
        return NextResponse.json({ error: "You don't have permission to verify this repository" }, { status: 403 })
      }
      console.log("[v0] Repository ownership verified")

      console.log("[v0] Fetching repository details...")
      const repoDetails = await Promise.race([
        fetchRepoDetails(owner, repoName, accessToken),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000)),
      ])
      console.log("[v0] Repository details fetched:", {
        name: repoDetails.name,
        stars: repoDetails.stargazers_count,
        forks: repoDetails.forks_count,
      })

      console.log("[v0] Checking for existing project...")
      const { data: existingProject, error: selectError } = await supabase
        .from("projects")
        .select("id")
        .eq("github_repo_url", repoUrl)
        .eq("user_id", user.id)
        .single()

      if (selectError && selectError.code !== "PGRST116") {
        console.error("[v0] Database select error:", selectError)
        return NextResponse.json({ error: "Database error while checking existing project" }, { status: 500 })
      }

      let project
      if (existingProject) {
        console.log("[v0] Updating existing project:", existingProject.id)
        const { data: updatedProject, error: updateError } = await supabase
          .from("projects")
          .update({
            repo_name: repoDetails.name,
            repo_description: repoDetails.description,
            repo_stars: repoDetails.stargazers_count,
            repo_forks: repoDetails.forks_count,
            repo_language: repoDetails.language,
            repo_verified: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingProject.id)
          .select()
          .single()

        if (updateError) {
          console.error("[v0] Database update error:", updateError)
          return NextResponse.json({ error: "Failed to update repository information" }, { status: 500 })
        }
        project = updatedProject
        console.log("[v0] Project updated successfully")
      } else {
        console.log("[v0] Creating new project...")
        const { data: newProject, error: insertError } = await supabase
          .from("projects")
          .insert({
            user_id: user.id,
            github_repo_url: repoUrl,
            repo_name: repoDetails.name,
            repo_description: repoDetails.description,
            repo_stars: repoDetails.stargazers_count,
            repo_forks: repoDetails.forks_count,
            repo_language: repoDetails.language,
            repo_verified: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (insertError) {
          console.error("[v0] Database insert error:", insertError)
          return NextResponse.json({ error: "Failed to save repository information" }, { status: 500 })
        }
        project = newProject
        console.log("[v0] Project created successfully:", project.id)
      }

      console.log("[v0] Repository verification successful:", { projectId: project.id, repoUrl })

      return NextResponse.json({
        success: true,
        project,
        repoDetails: {
          name: repoDetails.name,
          description: repoDetails.description,
          stars: repoDetails.stargazers_count,
          forks: repoDetails.forks_count,
          language: repoDetails.language,
        },
      })
    } catch (githubError) {
      console.error("[v0] GitHub API error:", githubError)
      if (githubError.message === "Timeout") {
        return NextResponse.json({ error: "GitHub API request timed out. Please try again." }, { status: 408 })
      }
      return NextResponse.json(
        { error: "Failed to access GitHub API. Please check your permissions." },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("[v0] Error verifying repository:", error)
    return NextResponse.json({ error: "Failed to verify repository" }, { status: 500 })
  }
}
