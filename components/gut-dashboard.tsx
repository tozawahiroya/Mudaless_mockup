"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Asset } from "@/lib/types"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react'

interface GutDashboardProps {
  assets: Asset[]
}

export function GutDashboard({ assets }: GutDashboardProps) {
  const gutStats = useMemo(() => {
    const assetsWithGUT = assets.filter((a) => a.g && a.u && a.t)
    const totalGUT = assetsWithGUT.reduce((sum, a) => sum + a.g! + a.u! + a.t!, 0)
    const avgGUT = assetsWithGUT.length > 0 ? totalGUT / assetsWithGUT.length : 0

    const highRisk = assetsWithGUT.filter((a) => a.g! + a.u! + a.t! >= 7).length
    const mediumRisk = assetsWithGUT.filter((a) => {
      const score = a.g! + a.u! + a.t!
      return score >= 5 && score <= 6
    }).length
    const lowRisk = assetsWithGUT.filter((a) => a.g! + a.u! + a.t! <= 4).length

    return { avgGUT: avgGUT.toFixed(1), highRisk, mediumRisk, lowRisk, total: assetsWithGUT.length }
  }, [assets])

  const gutChartData = useMemo(() => {
    return [
      { range: "低リスク (≤4)", count: gutStats.lowRisk, fill: "hsl(var(--chart-1))" },
      { range: "中リスク (5-6)", count: gutStats.mediumRisk, fill: "hsl(var(--chart-2))" },
      { range: "高リスク (≥7)", count: gutStats.highRisk, fill: "hsl(var(--destructive))" },
    ]
  }, [gutStats])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h2 className="text-xl sm:text-2xl font-bold">GUT指標（入力結果）</h2>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均GUTスコア</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gutStats.avgGUT}</div>
            <p className="text-xs text-muted-foreground">評価済み {gutStats.total}件</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">高リスク資産</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{gutStats.highRisk}</div>
            <p className="text-xs text-muted-foreground">GUT値 7以上</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">中リスク資産</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{gutStats.mediumRisk}</div>
            <p className="text-xs text-muted-foreground">GUT値 5-6</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">低リスク資産</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{gutStats.lowRisk}</div>
            <p className="text-xs text-muted-foreground">GUT値 4以下</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">GUTスコア分布</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
              <BarChart data={gutChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="hsl(var(--chart-1))" name="資産数" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">リスク分布（円グラフ）</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
              <PieChart>
                <Pie
                  data={gutChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ range, count }) => `${range}: ${count}件`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {gutChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
