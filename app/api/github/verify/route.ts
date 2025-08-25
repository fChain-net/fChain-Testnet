import { createClient } from "@/lib/supabase/server"
import { verifyRepoOwnership, fetchRepoDetails } from "@/lib/github"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { repoUrl } = await request.json()

    if (!repoUrl) {
      return NextResponse.json({ error: "Repository URL is required" }, { status: 400 })
    }

    // Parse GitHub URL to extract owner and repo name
    const urlMatch = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/)
    if (!urlMatch) {
      return NextResponse.json({ error: "Invalid GitHub repository URL" }, { status: 400 })
    }

    const [, owner, repoName] = urlMatch

    // Get the user's GitHub access token
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const accessToken = session?.provider_token

    if (!accessToken) {
      return NextResponse.json({ error: "GitHub access token not found" }, { status: 400 })
    }

    // Verify ownership
    const isOwner = await verifyRepoOwnership(owner, repoName, accessToken)
    if (!isOwner) {
      return NextResponse.json({ error: "You don't have permission to verify this repository" }, { status: 403 })
    }

    // Fetch repository details
    const repoDetails = await fetchRepoDetails(owner, repoName, accessToken)

    // Store/update repository information in database
    const { data: project, error: dbError } = await supabase
      .from("projects")
      .upsert(
        {
          user_id: user.id,
          github_repo_url: repoUrl,
          repo_name: repoDetails.name,
          repo_description: repoDetails.description,
          repo_stars: repoDetails.stargazers_count,
          repo_forks: repoDetails.forks_count,
          repo_language: repoDetails.language,
          repo_verified: true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "github_repo_url,user_id",
        },
      )
      .select()
      .single()

    if (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.json({ error: "Failed to save repository information" }, { status: 500 })
    }

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
  } catch (error) {
    console.error("Error verifying repository:", error)
    return NextResponse.json({ error: "Failed to verify repository" }, { status: 500 })
  }
}
