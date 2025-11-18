"use client"

import type React from "react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AssetTable } from "@/components/asset-table"
import { ProgressDashboard } from "@/components/progress-dashboard"
import { GutDashboard } from "@/components/gut-dashboard"
import type { Asset } from "@/lib/types"

interface MudalessViewProps {
  assets: Asset[]
  setAssets: React.Dispatch<React.SetStateAction<Asset[]>>
}

export function MudalessView({ assets, setAssets }: MudalessViewProps) {
  const handleUpdateAsset = (updatedAsset: Asset) => {
    setAssets((prev) => prev.map((asset) => (asset.id === updatedAsset.id ? updatedAsset : asset)))
  }

  const handleApprove = (assetId: string, asset: Asset) => {
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

  const handleReject = (assetId: string, comment: string) => {
    setAssets((prev) =>
      prev.map((asset) =>
        asset.id === assetId
          ? { ...asset, comment, status: "差し戻し", updatedAt: new Date().toLocaleString("ja-JP") }
          : asset,
      ),
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
