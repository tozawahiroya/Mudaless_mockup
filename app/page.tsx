"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CustomerView } from "@/components/customer-view"
import { MudalessView } from "@/components/mudaless-view"
import { Building2 } from "lucide-react"
import { initialAssets } from "@/lib/mock-data"
import type { Asset } from "@/lib/types"
import { loadAssets, saveAssetsToDb } from "@/lib/db"
import { supabase } from "@/lib/supabase/client"

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

    // Supabase Realtimeで資産の変更を監視（他のデバイスからの更新を検知）
    if (supabase) {
      let isSubscribed = false
      let pollInterval: NodeJS.Timeout | null = null

      const channel = supabase
        .channel('assets-changes', {
          config: {
            broadcast: { self: true },
            presence: { key: '' },
          },
        })
        .on(
          'postgres_changes',
          {
            event: '*', // INSERT, UPDATE, DELETE すべてを監視
            schema: 'public',
            table: 'assets',
          },
          async (payload) => {
            console.log('Realtime event received:', payload)
            // データベースから最新のデータを再取得
            const updatedAssets = await loadAssets()
            if (updatedAssets.length > 0) {
              setAssets(updatedAssets)
            }
          }
        )
        .subscribe((status) => {
          console.log('Realtime subscription status:', status)
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to Realtime changes')
            isSubscribed = true
            // Realtimeが動作している場合はポーリングを停止
            if (pollInterval) {
              clearInterval(pollInterval)
              pollInterval = null
            }
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            console.warn('Realtime subscription failed, falling back to polling')
            isSubscribed = false
            // Realtimeが失敗した場合、ポーリング方式にフォールバック
            if (!pollInterval) {
              pollInterval = setInterval(async () => {
                const updatedAssets = await loadAssets()
                if (updatedAssets.length > 0) {
                  setAssets((prev) => {
                    // 変更があった場合のみ更新
                    const prevUpdatedAt = prev.map((a) => a.updatedAt).join(',')
                    const newUpdatedAt = updatedAssets.map((a) => a.updatedAt).join(',')
                    if (prevUpdatedAt !== newUpdatedAt) {
                      return updatedAssets
                    }
                    return prev
                  })
                }
              }, 3000) // 3秒ごとにポーリング
            }
          }
        })

      // 初期ポーリング（Realtimeが確立されるまでの間）
      const initialPoll = setInterval(async () => {
        if (!isSubscribed) {
          const updatedAssets = await loadAssets()
          if (updatedAssets.length > 0) {
            setAssets((prev) => {
              const prevUpdatedAt = prev.map((a) => a.updatedAt).join(',')
              const newUpdatedAt = updatedAssets.map((a) => a.updatedAt).join(',')
              if (prevUpdatedAt !== newUpdatedAt) {
                return updatedAssets
              }
              return prev
            })
          }
        } else {
          clearInterval(initialPoll)
        }
      }, 2000) // 2秒ごとにポーリング

      return () => {
        if (supabase) {
          supabase.removeChannel(channel)
        }
        if (pollInterval) {
          clearInterval(pollInterval)
        }
        clearInterval(initialPoll)
      }
    }
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
