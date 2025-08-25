"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"

interface ProjectFiltersProps {
  languages: string[]
}

export function ProjectFilters({ languages }: ProjectFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [language, setLanguage] = useState(searchParams.get("language") || "all")
  const [sort, setSort] = useState(searchParams.get("sort") || "newest")

  const updateFilters = () => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (language !== "all") params.set("language", language)
    if (sort !== "newest") params.set("sort", sort)

    router.push(`/explore?${params.toString()}`)
  }

  const clearFilters = () => {
    setSearch("")
    setLanguage("all")
    setSort("newest")
    router.push("/explore")
  }

  const hasActiveFilters = search || language !== "all" || sort !== "newest"

  return (
    <div className="bg-muted/50 rounded-lg p-4 mb-8">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects, tokens, or repositories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              onKeyDown={(e) => e.key === "Enter" && updateFilters()}
            />
          </div>
        </div>

        {/* Language Filter */}
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="All Languages" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Languages</SelectItem>
            {languages.map((lang) => (
              <SelectItem key={lang} value={lang}>
                {lang}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="market_cap">Market Cap</SelectItem>
            <SelectItem value="stars">GitHub Stars</SelectItem>
          </SelectContent>
        </Select>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button onClick={updateFilters}>Apply</Button>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
