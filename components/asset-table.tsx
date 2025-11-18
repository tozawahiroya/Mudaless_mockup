"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { AssetEditPanel } from "@/components/asset-edit-panel"
import type { Asset, FilterState } from "@/lib/types"
import { factories, buildings, floors, statuses } from "@/lib/mock-data"
import { Search, Filter, Send } from 'lucide-react'

interface AssetTableProps {
  assets: Asset[]
  onUpdateAsset: (asset: Asset) => void
  onSubmitAssets?: (selectedIds: string[]) => void
  onApprove?: (assetId: string) => void
  onReject?: (assetId: string) => void
  viewMode: "customer" | "mudaless"
}

export function AssetTable({ assets, onUpdateAsset, onSubmitAssets, onApprove, onReject, viewMode }: AssetTableProps) {
  const [filters, setFilters] = useState<FilterState>({
    factory: "全て",
    building: "全て",
    floor: "全て",
    status: "全て",
    search: "",
  })
  const [selectedAssets, setSelectedAssets] = useState<string[]>([])
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      if (filters.factory !== "全て" && asset.factory !== filters.factory) return false
      if (filters.building !== "全て" && asset.building !== filters.building) return false
      if (filters.floor !== "全て" && asset.floor !== filters.floor) return false
      if (filters.status !== "全て" && asset.status !== filters.status) return false
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        return (
          asset.assetNumber.toLowerCase().includes(searchLower) ||
          asset.equipmentName.toLowerCase().includes(searchLower) ||
          asset.catalogName.toLowerCase().includes(searchLower)
        )
      }
      return true
    })
  }, [assets, filters])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAssets(filteredAssets.map((a) => a.id))
    } else {
      setSelectedAssets([])
    }
  }

  const handleSelectAsset = (assetId: string, checked: boolean) => {
    if (checked) {
      setSelectedAssets((prev) => [...prev, assetId])
    } else {
      setSelectedAssets((prev) => prev.filter((id) => id !== assetId))
    }
  }

  const handleSubmit = () => {
    if (onSubmitAssets && selectedAssets.length > 0) {
      onSubmitAssets(selectedAssets)
      setSelectedAssets([])
    }
  }

  const getStatusBadge = (status: Asset["status"]) => {
    const variants: Record<Asset["status"], "default" | "secondary" | "outline" | "destructive"> = {
      未入力: "outline",
      確認待ち: "secondary",
      承認済み: "default",
      差し戻し: "destructive",
    }
    return <Badge variant={variants[status]}>{status}</Badge>
  }

  const activeFilters = Object.entries(filters).filter(([key, value]) => key !== "search" && value !== "全て")

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>{viewMode === "customer" ? "固定資産一覧" : "確認・GUT入力"}</CardTitle>
            {viewMode === "customer" && selectedAssets.length > 0 && (
              <Button onClick={handleSubmit} size="sm" className="w-full sm:w-auto">
                <Send className="mr-2 h-4 w-4" />
                選択した資産を送信 ({selectedAssets.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4 rounded-lg border bg-muted/30 p-3 sm:p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Filter className="h-4 w-4" />
              検索・フィルター
            </div>
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <Select value={filters.factory} onValueChange={(v) => setFilters({ ...filters, factory: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="工場" />
                </SelectTrigger>
                <SelectContent>
                  {factories.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.building} onValueChange={(v) => setFilters({ ...filters, building: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="建物" />
                </SelectTrigger>
                <SelectContent>
                  {buildings.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.floor} onValueChange={(v) => setFilters({ ...filters, floor: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="フロア" />
                </SelectTrigger>
                <SelectContent>
                  {floors.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v as any })}>
                <SelectTrigger>
                  <SelectValue placeholder="ステータス" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="設備名で検索..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-9"
                />
              </div>
            </div>

            {activeFilters.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">アクティブフィルター:</span>
                {activeFilters.map(([key, value]) => (
                  <Badge key={key} variant="secondary" className="text-xs">
                    {key === "factory" && "工場"}
                    {key === "building" && "建物"}
                    {key === "floor" && "フロア"}
                    {key === "status" && "ステータス"}: {value}
                  </Badge>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setFilters({ factory: "全て", building: "全て", floor: "全て", status: "全て", search: "" })
                  }
                  className="h-6 px-2 text-xs"
                >
                  クリア
                </Button>
              </div>
            )}
          </div>

          <div className="text-sm text-muted-foreground">{filteredAssets.length} 件の資産が見つかりました</div>

          <div className="overflow-x-auto rounded-lg border -mx-6 sm:mx-0">
            <div className="min-w-[1200px]">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    {viewMode === "customer" && (
                      <th className="p-3 text-left">
                        <Checkbox
                          checked={
                            filteredAssets.length > 0 && filteredAssets.every((a) => selectedAssets.includes(a.id))
                          }
                          onCheckedChange={handleSelectAll}
                        />
                      </th>
                    )}
                    <th className="p-3 text-left font-semibold text-foreground">資産番号</th>
                    <th className="p-3 text-left font-semibold text-foreground">設備名</th>
                    <th className="p-3 text-left font-semibold text-foreground">カタログ名</th>
                    <th className="p-3 text-left font-semibold text-foreground">工場</th>
                    <th className="p-3 text-left font-semibold text-foreground">建物</th>
                    <th className="p-3 text-left font-semibold text-foreground">フロア</th>
                    <th className="p-3 text-left font-semibold text-foreground">取得年月日</th>
                    <th className="p-3 text-right font-semibold text-foreground">取得金額</th>
                    <th className="p-3 text-center font-semibold text-foreground">G</th>
                    <th className="p-3 text-center font-semibold text-foreground">U</th>
                    <th className="p-3 text-center font-semibold text-foreground">T</th>
                    <th className="p-3 text-left font-semibold text-foreground">ステータス</th>
                    <th className="p-3 text-left font-semibold text-foreground">入力者</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.map((asset) => (
                    <tr
                      key={asset.id}
                      className="cursor-pointer border-t hover:bg-muted/30"
                      onClick={() => setEditingAsset(asset)}
                    >
                      {viewMode === "customer" && (
                        <td className="p-3" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedAssets.includes(asset.id)}
                            onCheckedChange={(checked) => handleSelectAsset(asset.id, checked as boolean)}
                          />
                        </td>
                      )}
                      <td className="p-3 font-mono text-xs">{asset.assetNumber}</td>
                      <td className="p-3">{asset.equipmentName}</td>
                      <td className="p-3 text-muted-foreground">{asset.catalogName}</td>
                      <td className="p-3">{asset.factory}</td>
                      <td className="p-3">{asset.building}</td>
                      <td className="p-3">{asset.floor}</td>
                      <td className="p-3">{asset.acquisitionDate}</td>
                      <td className="p-3 text-right">{asset.acquisitionAmount?.toLocaleString("ja-JP") || "-"}</td>
                      <td className="p-3 text-center">{asset.g ?? "-"}</td>
                      <td className="p-3 text-center">{asset.u ?? "-"}</td>
                      <td className="p-3 text-center">{asset.t ?? "-"}</td>
                      <td className="p-3">{getStatusBadge(asset.status)}</td>
                      <td className="p-3 text-muted-foreground">{asset.inputBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      <AssetEditPanel
        asset={editingAsset}
        onClose={() => setEditingAsset(null)}
        onSave={onUpdateAsset}
        onApprove={onApprove}
        onReject={onReject}
        viewMode={viewMode}
      />
    </>
  )
}
