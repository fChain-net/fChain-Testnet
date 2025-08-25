import { createClient } from "@/lib/supabase/server"
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

    const { repoData, tokenData, pumpFunData, metadataUri, transactionSignature } = await request.json()

    // Create or update project in database
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .upsert(
        {
          user_id: user.id,
          github_repo_url: repoData.url,
          repo_name: repoData.name,
          repo_description: repoData.description,
          repo_stars: repoData.stars,
          repo_forks: repoData.forks,
          repo_language: repoData.language,
          repo_verified: true,
          token_name: tokenData.name,
          token_symbol: tokenData.symbol,
          token_description: tokenData.description,
          token_image_url: tokenData.imageUrl,
          mint_address: pumpFunData.mint,
          bonding_curve_address: pumpFunData.bondingCurve,
          associated_bonding_curve_address: pumpFunData.associatedBondingCurve,
          creator_address: user.id,
          pump_fun_url: `https://pump.fun/${pumpFunData.mint}`, // Mock URL
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "github_repo_url,user_id",
        },
      )
      .select()
      .single()

    if (projectError) {
      console.error("Error creating project:", projectError)
      return NextResponse.json({ error: "Failed to create project" }, { status: 500 })
    }

    // Record the transaction
    const { error: transactionError } = await supabase.from("transactions").insert({
      project_id: project.id,
      user_id: user.id,
      transaction_type: "create",
      signature: transactionSignature,
      status: "confirmed",
    })

    if (transactionError) {
      console.error("Error recording transaction:", transactionError)
    }

    return NextResponse.json({ project, success: true })
  } catch (error) {
    console.error("Error creating project:", error)
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 })
  }
}
