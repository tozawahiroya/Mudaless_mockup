"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CustomerView } from "@/components/customer-view"
import { MudalessView } from "@/components/mudaless-view"
import { Building2 } from "lucide-react"
import { initialAssets } from "@/lib/mock-data"
import type { Asset } from "@/lib/types"
import { loadAssets, saveAssetsToDb } from "@/lib/db"

export default function Page() {
  const [activeTab, setActiveTab] = useState("customer")
  const [assets, setAssets] = useState<Asset[]>([])
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      if (typeof window === 'undefined') return
      const storedAssets = await loadAssets()
      setAssets(storedAssets.length > 0 ? storedAssets : initialAssets)
      setIsHydrated(true)
    }
    loadData()
  }, [])

  useEffect(() => {
    if (!isHydrated) return
    saveAssetsToDb(assets)
  }, [assets, isHydrated])

  const handleImport = (importedAssets: Asset[]) => {
    setAssets(importedAssets)
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Building2 className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Needless</h1>
                <p className="text-sm text-muted-foreground">固定資産台帳管理システム</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="customer">顧客側UI</TabsTrigger>
            <TabsTrigger value="mudaless">ムダレス側UI</TabsTrigger>
          </TabsList>

          {isHydrated ? (
            <>
              <TabsContent value="customer" className="mt-6">
                <CustomerView assets={assets} setAssets={setAssets} onImportAssets={handleImport} />
              </TabsContent>

              <TabsContent value="mudaless" className="mt-6">
                <MudalessView assets={assets} setAssets={setAssets} />
              </TabsContent>
            </>
          ) : (
            <div className="mt-6 flex items-center justify-center py-12">
              <p className="text-muted-foreground">読み込み中...</p>
            </div>
          )}
        </Tabs>
      </main>
    </div>
  )
}
