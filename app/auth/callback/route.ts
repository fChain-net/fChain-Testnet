import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  console.log("[v0] Auth callback started")

  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"

  console.log("[v0] OAuth code received:", code ? "yes" : "no")

  if (code) {
    try {
      const supabase = await createClient()
      console.log("[v0] Supabase client created")

      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.log("[v0] OAuth exchange error:", error.message)
        return NextResponse.redirect(`${origin}/auth/login?error=oauth_error`)
      }

      if (data.user) {
        console.log("[v0] User authenticated:", data.user.id)

        try {
          // Check if user profile exists
          const { data: existingProfile, error: profileError } = await supabase
            .from("users")
            .select("id")
            .eq("id", data.user.id)
            .single()

          if (profileError && profileError.code !== "PGRST116") {
            // PGRST116 = no rows returned
            console.log("[v0] Profile check error:", profileError.message)
          }

          if (!existingProfile) {
            console.log("[v0] Creating new user profile")

            const { error: insertError } = await supabase.from("users").insert({
              id: data.user.id,
              github_username:
                data.user.user_metadata?.user_name ||
                data.user.user_metadata?.preferred_username ||
                data.user.user_metadata?.login,
              github_avatar_url: data.user.user_metadata?.avatar_url,
              email: data.user.email,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })

            if (insertError) {
              console.log("[v0] User creation error:", insertError.message)
              // Continue anyway - user is authenticated even if profile creation fails
            } else {
              console.log("[v0] User profile created successfully")
            }
          } else {
            console.log("[v0] User profile already exists")
          }
        } catch (dbError) {
          console.log("[v0] Database operation error:", dbError)
          // Continue anyway - user is authenticated
        }

        console.log("[v0] Redirecting to dashboard")
        return NextResponse.redirect(`${origin}${next}`)
      }
    } catch (error) {
      console.log("[v0] Auth callback error:", error)
      return NextResponse.redirect(`${origin}/auth/login?error=callback_error`)
    }
  }

  console.log("[v0] No code or authentication failed, redirecting to login")
  return NextResponse.redirect(`${origin}/auth/login`)
}
