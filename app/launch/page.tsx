import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { LaunchTokenForm } from "@/components/launch-token-form"

export default async function LaunchPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Launch Your Token</h1>
            <p className="text-muted-foreground">Connect your GitHub repository and create a token on Pump.fun</p>
          </div>

          <LaunchTokenForm />
        </div>
      </div>
    </div>
  )
}
