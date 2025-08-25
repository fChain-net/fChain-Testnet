"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Github } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleGitHubLogin = async () => {
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      console.log("[v0] Starting GitHub OAuth flow")
      console.log("[v0] Current origin:", window.location.origin)

      const redirectUrl = `${window.location.origin}/auth/callback`
      console.log("[v0] Redirect URL:", redirectUrl)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: redirectUrl,
          scopes: "read:user user:email",
        },
      })

      if (error) {
        console.error("[v0] OAuth error:", error)
        if (error.message.includes("Provider not found") || error.message.includes("OAuth")) {
          throw new Error("GitHub OAuth is not configured. Please contact the site administrator.")
        }
        throw error
      }

      console.log("[v0] OAuth initiated successfully")
    } catch (error: unknown) {
      console.error("[v0] GitHub OAuth error:", error)
      setError(error instanceof Error ? error.message : "An error occurred during authentication")
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Welcome to Gitr</CardTitle>
              <CardDescription>
                Connect your GitHub account to start launching tokens linked to your repositories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-6">
                {error && (
                  <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">{error}</div>
                )}
                <Button onClick={handleGitHubLogin} className="w-full" disabled={isLoading} size="lg">
                  <Github className="mr-2 h-5 w-5" />
                  {isLoading ? "Connecting..." : "Continue with GitHub"}
                </Button>
                <div className="text-center text-sm text-muted-foreground">
                  By continuing, you agree to our terms of service and privacy policy
                </div>
                <div className="text-center text-sm">
                  <Link href="/" className="text-primary hover:underline underline-offset-4">
                    ← Back to home
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
