"use client"

import type React from "react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileUpload } from "@/components/file-upload"
import { AssetTable } from "@/components/asset-table"
import { ProgressDashboard } from "@/components/progress-dashboard"
import { GutDashboard } from "@/components/gut-dashboard"
import type { Asset } from "@/lib/types"

interface CustomerViewProps {
  assets: Asset[]
  setAssets: React.Dispatch<React.SetStateAction<Asset[]>>
  onImportAssets: (assets: Asset[]) => void
}

export function CustomerView({ assets, setAssets, onImportAssets }: CustomerViewProps) {
  const handleUpdateAsset = (updatedAsset: Asset) => {
    setAssets((prev) => prev.map((asset) => (asset.id === updatedAsset.id ? updatedAsset : asset)))
  }

  const handleSubmitAssets = (selectedIds: string[]) => {
    setAssets((prev) =>
      prev.map((asset) =>
        selectedIds.includes(asset.id) && asset.status === "未入力"
          ? { ...asset, status: "確認待ち", updatedAt: new Date().toLocaleString("ja-JP") }
          : asset,
      ),
    )
  }

  return (
    <Tabs defaultValue="list" className="w-full">
      <TabsList className="w-full justify-start overflow-x-auto">
        <TabsTrigger value="upload" className="flex-shrink-0">台帳取り込み</TabsTrigger>
        <TabsTrigger value="list" className="flex-shrink-0">固定資産一覧</TabsTrigger>
        <TabsTrigger value="progress" className="flex-shrink-0">進捗管理</TabsTrigger>
        <TabsTrigger value="gut" className="flex-shrink-0">GUT評価</TabsTrigger>
      </TabsList>

      <TabsContent value="upload" className="mt-6">
        <FileUpload onImport={onImportAssets} />
      </TabsContent>

      <TabsContent value="list" className="mt-6">
        <AssetTable
          assets={assets}
          onUpdateAsset={handleUpdateAsset}
          onSubmitAssets={handleSubmitAssets}
          viewMode="customer"
        />
      </TabsContent>

      <TabsContent value="progress" className="mt-6">
        <ProgressDashboard assets={assets} />
      </TabsContent>

      <TabsContent value="gut" className="mt-6">
        <GutDashboard assets={assets} />
      </TabsContent>
    </Tabs>
  )
}
