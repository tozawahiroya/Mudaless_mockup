"use client"

import type React from "react"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
  ReferenceLine,
} from "recharts"
import { FileText, TrendingUp, Target, Clock } from 'lucide-react'
import { AssetEditPanel } from "@/components/asset-edit-panel"

interface ProgressDashboardProps {
  assets: Asset[]
  isMudaless?: boolean
  setAssets?: React.Dispatch<React.SetStateAction<Asset[]>>
}

export function ProgressDashboard({ assets, isMudaless = false, setAssets }: ProgressDashboardProps) {
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)

  const overallStats = useMemo(() => {
    const total = assets.length
    const inProgress = assets.filter((a) => a.status === "確認待ち" || a.status === "承認済み").length
    const completed = assets.filter((a) => a.status === "承認済み").length
    const progressRate = total > 0 ? ((inProgress / total) * 100).toFixed(1) : "0.0"

    // Weekly plan: 5 assets per week
    const weeklyPlan = 5
    const thisWeekCompleted = inProgress // Since we're in week 1, all in-progress are from this week
    const planComparison = `${thisWeekCompleted} / ${weeklyPlan}`

    return { total, inProgress, completed, progressRate, planComparison, thisWeekCompleted, weeklyPlan }
  }, [assets])

  const timeSeriesData = useMemo(() => {
    const cumulative = assets.filter((a) => a.status === "確認待ち" || a.status === "承認済み").length
    const registered = assets.filter((a) => a.status === "確認待ち" || a.status === "承認済み").length

    // Week 1 (current week) - actual data
    return [{ week: "第1週", cumulative, weekly: registered }]
  }, [assets])

  const factoryStats = useMemo(() => {
    const factoryTotals: Record<string, number> = {}
    const factoryCumulative: Record<string, number> = {}
    const factoryWeekly: Record<string, number> = {}

    // Count total assets per factory
    assets.forEach((asset) => {
      factoryTotals[asset.factory] = (factoryTotals[asset.factory] || 0) + 1
    })

    // Count cumulative (confirmed + approved) and weekly (registered this week)
    assets.forEach((asset) => {
      if (asset.status === "承認済み" || asset.status === "確認待ち") {
        factoryCumulative[asset.factory] = (factoryCumulative[asset.factory] || 0) + 1
      }
      if (asset.status === "確認待ち" || asset.status === "承認済み") {
        factoryWeekly[asset.factory] = (factoryWeekly[asset.factory] || 0) + 1
      }
    })

    return Object.keys(factoryTotals).map((factory) => ({
      factory,
      total: factoryTotals[factory],
      cumulative: Math.min(factoryCumulative[factory] || 0, factoryTotals[factory]),
      weekly: factoryWeekly[factory] || 0,
    }))
  }, [assets])

  const assigneeStats = useMemo(() => {
    const stats = assets.reduce(
      (acc, asset) => {
        if (!acc[asset.assignedTo]) {
          acc[asset.assignedTo] = {
            assignee: asset.assignedTo,
            total: 0,
            completed: 0,
            progressRate: 0,
          }
        }
        acc[asset.assignedTo].total++
        if (asset.status === "承認済み" || asset.status === "確認待ち") {
          acc[asset.assignedTo].completed++
        }
        return acc
      },
      {} as Record<string, any>,
    )

    return Object.values(stats).map((stat: any) => ({
      ...stat,
      progressRate: stat.total > 0 ? ((stat.completed / stat.total) * 100).toFixed(1) : "0.0",
    }))
  }, [assets])

  const pendingReviewAssets = useMemo(() => {
    return assets.filter((a) => a.status === "確認待ち")
  }, [assets])

  const handleApprove = (assetId: string, asset: Asset) => {
    if (setAssets) {
      setAssets((prev) =>
        prev.map((a) =>
          a.id === assetId
            ? {
                ...a,
                g: asset.g,
                u: asset.u,
                t: asset.t,
                comment: asset.comment,
                status: "承認済み",
                updatedAt: new Date().toLocaleString("ja-JP"),
              }
            : a,
        ),
      )
    }
  }

  const handleReject = (assetId: string, comment: string) => {
    if (setAssets) {
      setAssets((prev) =>
        prev.map((asset) =>
          asset.id === assetId
            ? { ...asset, comment, status: "差し戻し", updatedAt: new Date().toLocaleString("ja-JP") }
            : asset,
        ),
      )
    }
  }

  const handleUpdateAsset = (updatedAsset: Asset) => {
    if (setAssets) {
      setAssets((prev) => prev.map((asset) => (asset.id === updatedAsset.id ? updatedAsset : asset)))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-4 text-xl sm:text-2xl font-bold">全体傾向</h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総資産数</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallStats.total}</div>
              <p className="text-xs text-muted-foreground">登録済み資産</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">進捗率</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{overallStats.progressRate}%</div>
              <p className="text-xs text-muted-foreground">{overallStats.inProgress}件 完了</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">計画比（今週）</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallStats.planComparison}</div>
              <p className="text-xs text-muted-foreground">週間計画: {overallStats.weeklyPlan}件</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {isMudaless && (
        <div>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  確認待ちリスト
                </CardTitle>
                <span className="rounded-full bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground">
                  {pendingReviewAssets.length}件
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {pendingReviewAssets.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">確認待ちの資産はありません</p>
              ) : (
                <div className="space-y-2">
                  {pendingReviewAssets.map((asset) => (
                    <div
                      key={asset.id}
                      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border bg-card p-3 sm:p-4 transition-colors hover:bg-muted/50"
                      onClick={() => setSelectedAsset(asset)}
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <span className="font-semibold text-foreground">{asset.assetNumber}</span>
                          <span className="text-sm text-foreground">{asset.equipmentName}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                          <span>{asset.factory}</span>
                          {asset.building && <span>{asset.building}</span>}
                          {asset.floor && <span>{asset.floor}</span>}
                          <span>担当: {asset.assignedTo}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:block sm:text-right">
                        <div className="text-xs text-muted-foreground">{asset.updatedAt}</div>
                        <Button size="sm" className="mt-0 sm:mt-2">
                          確認する
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <div>
        <h2 className="mb-4 text-xl sm:text-2xl font-bold">時間推移</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">累計確認済み件数</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                <BarChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis domain={[0, 15]} ticks={[0, 5, 10, 15]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="cumulative" fill="hsl(var(--primary))" name="累計件数" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">週間登録数</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                <BarChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis domain={[0, 15]} ticks={[0, 5, 10, 15]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="weekly" fill="hsl(var(--chart-1))" name="週間登録数" />
                  <ReferenceLine
                    y={5}
                    stroke="#9ca3af"
                    strokeWidth={2}
                    label={{ value: "週間計画: 5件", position: "right" }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-xl sm:text-2xl font-bold">工場別</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>工場別累積件数</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={factoryStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="factory" />
                  <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="cumulative" fill="hsl(var(--chart-2))" name="累積件数" />
                  <ReferenceLine
                    y={5}
                    stroke="#9ca3af"
                    strokeWidth={2}
                    label={{ value: "計画: 5件", position: "right" }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>工場別週間推移</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={factoryStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="factory" />
                  <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="weekly" fill="hsl(var(--chart-3))" name="今週の登録数" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-xl sm:text-2xl font-bold">担当者別分析</h2>
        <Card>
          <CardHeader>
            <CardTitle>担当者別進捗</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assigneeStats.map((stat: any) => (
                <div key={stat.assignee} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{stat.assignee}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        {stat.completed} / {stat.total}件
                      </span>
                      <span className="font-bold text-primary">{stat.progressRate}%</span>
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary transition-all" style={{ width: `${stat.progressRate}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {isMudaless && (
        <AssetEditPanel
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
          onSave={handleUpdateAsset}
          onApprove={handleApprove}
          onReject={handleReject}
          viewMode="mudaless"
        />
      )}
    </div>
  )
}
