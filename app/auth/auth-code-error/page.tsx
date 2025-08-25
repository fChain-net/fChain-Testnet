import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AlertCircle } from "lucide-react"

export default function AuthCodeErrorPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-2xl">Authentication Error</CardTitle>
            <CardDescription>There was a problem with the GitHub OAuth configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">This error typically occurs when:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>GitHub OAuth app callback URL is set to localhost</li>
                <li>OAuth app credentials don't match Supabase configuration</li>
                <li>GitHub OAuth app is not properly configured</li>
              </ul>
            </div>
            <div className="flex flex-col gap-2">
              <Button asChild>
                <Link href="/auth/login">Try Again</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">Back to Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
