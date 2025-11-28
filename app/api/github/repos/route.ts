import { createClient } from "@/lib/supabase/server"
import { fetchUserRepos } from "@/lib/github"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the user's GitHub access token from the session
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const accessToken = session?.provider_token

    if (!accessToken) {
      return NextResponse.json({ error: "Txt access token not found" }, { status: 400 })
    }

    const repos = await fetchUserRepos(accessToken)

    // Filter out forks and only show repos the user owns
    const ownedRepos = repos.filter((repo) => !repo.fork && repo.owner.login === user.user_metadata?.user_name)

    return NextResponse.json({ repos: ownedRepos })
  } catch (error) {
    console.error("Error fetching repos:", error)
    return NextResponse.json({ error: "Failed to fetch repositories" }, { status: 500 })
  }
}
