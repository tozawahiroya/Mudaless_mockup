// 統一されたデータベースインターフェース
// Supabaseが利用可能な場合はSupabaseを使用し、そうでない場合はlocalStorageを使用

import { loadAssetsFromStorage, persistAssetsToStorage } from './pseudo-db'
import { fetchAssets, saveAsset, saveAssets } from './supabase/assets'
import type { Asset } from './types'

const isSupabaseConfigured = () => {
  // コード内に直接記述されているため、常にtrueを返す
  return typeof window !== 'undefined'
}

// 資産を読み込む（Supabase優先、フォールバックはlocalStorage）
export const loadAssets = async (): Promise<Asset[]> => {
  if (typeof window === 'undefined') {
    return []
  }

  if (isSupabaseConfigured()) {
    try {
      const assets = await fetchAssets()
      if (assets.length > 0) {
        // Supabaseから取得したデータをlocalStorageにも保存（オフライン対応）
        persistAssetsToStorage(assets)
        return assets
      }
    } catch (error) {
      console.warn('Failed to load from Supabase, falling back to localStorage:', error)
    }
  }

  // localStorageから読み込み
  return loadAssetsFromStorage()
}

// 資産を保存（Supabase優先、フォールバックはlocalStorage）
export const saveAssetsToDb = async (assets: Asset[]): Promise<boolean> => {
  if (typeof window === 'undefined') {
    return false
  }

  // 常にlocalStorageにも保存（オフライン対応）
  persistAssetsToStorage(assets)

  if (isSupabaseConfigured()) {
    try {
      await saveAssets(assets)
      return true
    } catch (error) {
      console.warn('Failed to save to Supabase, using localStorage only:', error)
    }
  }

  return true
}

// 単一の資産を保存
// 最新データを上書き保存（競合チェックなし）
export const saveAssetToDb = async (asset: Asset): Promise<Asset | null> => {
  if (typeof window === 'undefined') {
    return null
  }

  if (isSupabaseConfigured()) {
    try {
      const saved = await saveAsset(asset)
      
      // Supabaseに保存成功した場合、localStorageも更新
      if (saved) {
        const currentAssets = loadAssetsFromStorage()
        const updatedAssets = currentAssets.map((a) => (a.id === saved.id ? saved : a))
        persistAssetsToStorage(updatedAssets)
      }
      
      return saved
    } catch (error) {
      console.warn('Failed to save to Supabase, using localStorage only:', error)
    }
  }

  // localStorageのみに保存（オフライン時）
  const currentAssets = loadAssetsFromStorage()
  const updatedAssets = currentAssets.map((a) => (a.id === asset.id ? asset : a))
  persistAssetsToStorage(updatedAssets)

  return asset
}

