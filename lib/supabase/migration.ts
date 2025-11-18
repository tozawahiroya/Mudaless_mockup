import { loadAssetsFromStorage, persistAssetsToStorage } from '../pseudo-db'
import { saveAssets, fetchAssets } from './assets'
import type { Asset } from '../types'

// localStorageからSupabaseにデータを移行
export const migrateLocalStorageToSupabase = async (): Promise<{
  success: boolean
  count: number
  error?: string
}> => {
  try {
    // localStorageからデータを読み込み
    const localAssets = loadAssetsFromStorage()

    if (localAssets.length === 0) {
      return { success: true, count: 0 }
    }

    // Supabaseに保存
    const saved = await saveAssets(localAssets)

    if (saved.length === 0) {
      return {
        success: false,
        count: 0,
        error: 'Failed to save assets to Supabase',
      }
    }

    return {
      success: true,
      count: saved.length,
    }
  } catch (error) {
    console.error('Migration error:', error)
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Supabaseからデータを読み込んでlocalStorageに保存（フォールバック用）
export const syncSupabaseToLocalStorage = async (): Promise<{
  success: boolean
  count: number
}> => {
  try {
    const assets = await fetchAssets()

    if (assets.length > 0) {
      persistAssetsToStorage(assets)
    }

    return {
      success: true,
      count: assets.length,
    }
  } catch (error) {
    console.error('Sync error:', error)
    return {
      success: false,
      count: 0,
    }
  }
}

