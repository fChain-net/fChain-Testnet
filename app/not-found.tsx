import { Button } from "@/components/ui/button"
import { Home, Search } from "lucide-react"
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
          <h2 className="text-2xl font-bold">Page not found</h2>
          <p className="text-muted-foreground">The page you're looking for doesn't exist or has been moved.</p>
        </div>
        <div className="flex gap-4 justify-center">
          <Button asChild>
            <Link href="/" className="gap-2">
              <Home className="h-4 w-4" />
              Go home
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/explore" className="gap-2">
              <Search className="h-4 w-4" />
              Explore projects
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
