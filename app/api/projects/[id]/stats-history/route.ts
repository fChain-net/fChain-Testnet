import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    const { data: history, error } = await supabase
      .from("github_stats_history")
      .select("*")
      .eq("project_id", params.id)
      .order("recorded_at", { ascending: true })

    if (error) {
      throw new Error("Failed to fetch stats history")
    }

    // Format data for chart
    const formattedHistory =
      history?.map((record) => ({
        date: record.recorded_at,
        stars: record.stars || 0,
        forks: record.forks || 0,
        weekly_stars: record.weekly_stars || 0,
        weekly_commits: record.weekly_commits || 0,
      })) || []

    return NextResponse.json({ history: formattedHistory })
  } catch (error) {
    console.error("Error fetching stats history:", error)
    return NextResponse.json({ error: "Failed to fetch stats history" }, { status: 500 })
  }
}
