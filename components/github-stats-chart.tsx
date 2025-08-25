"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Star, GitFork, TrendingUp } from "lucide-react"

interface GitHubStatsChartProps {
  projectId: string
}

interface StatsData {
  date: string
  stars: number
  forks: number
  weekly_stars: number
  weekly_commits: number
}

export function GitHubStatsChart({ projectId }: GitHubStatsChartProps) {
  const [statsData, setStatsData] = useState<StatsData[]>([])
  const [loading, setLoading] = useState(true)
  const [metric, setMetric] = useState("stars")

  useEffect(() => {
    fetchStatsHistory()
  }, [projectId])

  const fetchStatsHistory = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/stats-history`)
      if (response.ok) {
        const data = await response.json()
        setStatsData(data.history || [])
      }
    } catch (error) {
      console.error("Error fetching stats history:", error)
    } finally {
      setLoading(false)
    }
  }

  const getMetricData = () => {
    switch (metric) {
      case "forks":
        return {
          dataKey: "forks",
          name: "Forks",
          color: "#8884d8",
          icon: GitFork,
        }
      case "weekly_stars":
        return {
          dataKey: "weekly_stars",
          name: "Weekly Stars",
          color: "#82ca9d",
          icon: TrendingUp,
        }
      case "weekly_commits":
        return {
          dataKey: "weekly_commits",
          name: "Weekly Commits",
          color: "#ffc658",
          icon: TrendingUp,
        }
      default:
        return {
          dataKey: "stars",
          name: "Stars",
          color: "#ff7300",
          icon: Star,
        }
    }
  }

  const metricConfig = getMetricData()
  const IconComponent = metricConfig.icon

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>GitHub Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <IconComponent className="h-5 w-5" />
              GitHub Statistics
            </CardTitle>
            <CardDescription>Repository growth over time</CardDescription>
          </div>
          <Select value={metric} onValueChange={setMetric}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="stars">Stars</SelectItem>
              <SelectItem value="forks">Forks</SelectItem>
              <SelectItem value="weekly_stars">Weekly Stars</SelectItem>
              <SelectItem value="weekly_commits">Weekly Commits</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {statsData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={statsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
              <YAxis />
              <Tooltip
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value: number) => [value, metricConfig.name]}
              />
              <Line
                type="monotone"
                dataKey={metricConfig.dataKey}
                stroke={metricConfig.color}
                strokeWidth={2}
                dot={{ fill: metricConfig.color, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            No statistics data available
          </div>
        )}
      </CardContent>
    </Card>
  )
}
