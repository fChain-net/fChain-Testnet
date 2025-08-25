import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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

    const metadata = await request.json()

    // In a real implementation, you would upload to IPFS here
    // For demo purposes, we'll simulate this with a mock URI
    const mockUri = `https://ipfs.io/ipfs/Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`

    // You could also store the metadata in your database for backup
    const { error: dbError } = await supabase.from("token_metadata").insert({
      user_id: user.id,
      metadata: metadata,
      ipfs_uri: mockUri,
      created_at: new Date().toISOString(),
    })

    if (dbError) {
      console.error("Error storing metadata:", dbError)
    }

    return NextResponse.json({ uri: mockUri })
  } catch (error) {
    console.error("Error uploading metadata:", error)
    return NextResponse.json({ error: "Failed to upload metadata" }, { status: 500 })
  }
}
