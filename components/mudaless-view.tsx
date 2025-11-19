"use client"

import type React from "react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AssetTable } from "@/components/asset-table"
import { ProgressDashboard } from "@/components/progress-dashboard"
import { GutDashboard } from "@/components/gut-dashboard"
import type { Asset } from "@/lib/types"
import { saveAssetToDb } from "@/lib/db"

interface MudalessViewProps {
  assets: Asset[]
  setAssets: React.Dispatch<React.SetStateAction<Asset[]>>
}

export function MudalessView({ assets, setAssets }: MudalessViewProps) {
  const handleUpdateAsset = (updatedAsset: Asset) => {
    setAssets((prev) => prev.map((asset) => (asset.id === updatedAsset.id ? updatedAsset : asset)))
  }

  const handleApprove = async (assetId: string, asset: Asset) => {
    const approvedAsset = {
      ...asset,
      status: "承認済み" as Asset["status"],
      updatedAt: new Date().toLocaleString("ja-JP"),
    }
    
    // Supabaseに直接保存（最新データを上書き、他のデバイスに即座に反映）
    const saved = await saveAssetToDb(approvedAsset)
    
    const finalAsset = saved || approvedAsset
    setAssets((prev) =>
      prev.map((a) => (a.id === assetId ? finalAsset : a)),
    )
  }

  const handleReject = async (assetId: string, comment: string) => {
    const asset = assets.find((a) => a.id === assetId)
    if (!asset) return
    
    const rejectedAsset = {
      ...asset,
      comment,
      status: "差し戻し" as Asset["status"],
      updatedAt: new Date().toLocaleString("ja-JP"),
    }
    
    // Supabaseに直接保存（最新データを上書き、他のデバイスに即座に反映）
    const saved = await saveAssetToDb(rejectedAsset)
    
    const finalAsset = saved || rejectedAsset
    setAssets((prev) =>
      prev.map((a) => (a.id === assetId ? finalAsset : a)),
    )
  }

  return (
    <Tabs defaultValue="review" className="w-full">
      <TabsList className="w-full justify-start overflow-x-auto">
        <TabsTrigger value="review" className="flex-shrink-0">確認・GUT入力</TabsTrigger>
        <TabsTrigger value="progress" className="flex-shrink-0">進捗管理</TabsTrigger>
        <TabsTrigger value="gut" className="flex-shrink-0">GUT評価</TabsTrigger>
      </TabsList>

      <TabsContent value="review" className="mt-6">
        <AssetTable
          assets={assets}
          onUpdateAsset={handleUpdateAsset}
          onApprove={handleApprove}
          onReject={handleReject}
          viewMode="mudaless"
        />
      </TabsContent>

      <TabsContent value="progress" className="mt-6">
        <ProgressDashboard assets={assets} isMudaless={true} setAssets={setAssets} />
      </TabsContent>

      <TabsContent value="gut" className="mt-6">
        <GutDashboard assets={assets} />
      </TabsContent>
    </Tabs>
  )
}
