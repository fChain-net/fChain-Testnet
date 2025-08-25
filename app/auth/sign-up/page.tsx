"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Github } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleGitHubSignUp = async () => {
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: window.location.origin + "/dashboard",
          scopes: "read:user user:email",
        },
      })

      if (error) throw error
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Join Gitr</CardTitle>
              <CardDescription>
                Create your account and start launching tokens backed by your GitHub repositories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-6">
                {error && (
                  <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">{error}</div>
                )}
                <Button onClick={handleGitHubSignUp} className="w-full" disabled={isLoading} size="lg">
                  <Github className="mr-2 h-5 w-5" />
                  {isLoading ? "Connecting..." : "Sign up with GitHub"}
                </Button>
                <div className="text-center text-sm text-muted-foreground">
                  By signing up, you agree to our terms of service and privacy policy
                </div>
                <div className="text-center text-sm">
                  Already have an account?{" "}
                  <Link href="/auth/login" className="text-primary hover:underline underline-offset-4">
                    Sign in
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
