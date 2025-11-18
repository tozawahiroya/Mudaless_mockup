import { supabase } from './client'
import type { Asset } from '../types'

type AssetRow = {
  id: string
  asset_number: string
  equipment_name: string
  catalog_name: string | null
  lifespan_years: number | null
  description: string | null
  acquisition_amount: number | null
  acquisition_date: string
  factory: string
  building: string | null
  floor: string | null
  g: number | null
  u: number | null
  t: number | null
  status: Asset['status']
  input_by: string
  assigned_to: string | null
  updated_at: string
  comment: string | null
  created_at: string
}

type AssetInsert = Omit<AssetRow, 'created_at'> & { created_at?: string }
type AssetUpdate = Partial<AssetInsert>

// Asset型をSupabaseのRow型に変換
const assetToRow = (asset: Asset): AssetInsert => ({
  id: asset.id,
  asset_number: asset.assetNumber,
  equipment_name: asset.equipmentName,
  catalog_name: asset.catalogName || null,
  lifespan_years: asset.lifespanYears,
  description: asset.description || null,
  acquisition_amount: asset.acquisitionAmount,
  acquisition_date: asset.acquisitionDate,
  factory: asset.factory,
  building: asset.building || null,
  floor: asset.floor || null,
  g: asset.g,
  u: asset.u,
  t: asset.t,
  status: asset.status,
  input_by: asset.inputBy,
  assigned_to: asset.assignedTo || null,
  updated_at: asset.updatedAt,
  comment: asset.comment || null,
})

// SupabaseのRow型をAsset型に変換
const rowToAsset = (row: AssetRow): Asset => ({
  id: row.id,
  assetNumber: row.asset_number,
  equipmentName: row.equipment_name,
  catalogName: row.catalog_name || '',
  lifespanYears: row.lifespan_years,
  description: row.description || '',
  acquisitionAmount: row.acquisition_amount,
  acquisitionDate: row.acquisition_date,
  factory: row.factory,
  building: row.building || '',
  floor: row.floor || '',
  g: row.g,
  u: row.u,
  t: row.t,
  status: row.status,
  inputBy: row.input_by,
  assignedTo: row.assigned_to || '',
  updatedAt: row.updated_at,
  comment: row.comment || '',
  attachments: [], // 添付ファイルは別テーブルから取得
})

// 全資産を取得
export const fetchAssets = async (): Promise<Asset[]> => {
  try {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) throw error

    const assets = (data || []).map(rowToAsset)

    // 各資産の添付ファイルを取得
    const assetsWithAttachments = await Promise.all(
      assets.map(async (asset) => {
        const { data: attachments } = await supabase
          .from('asset_attachments')
          .select('file_name, file_path')
          .eq('asset_id', asset.id)

        return {
          ...asset,
          attachments: attachments?.map((a) => a.file_name) || [],
        }
      })
    )

    return assetsWithAttachments
  } catch (error) {
    console.error('Error fetching assets:', error)
    return []
  }
}

// 資産を保存（新規作成または更新）
export const saveAsset = async (asset: Asset): Promise<Asset | null> => {
  try {
    const row = assetToRow(asset)

    const { data, error } = await supabase
      .from('assets')
      .upsert(row, {
        onConflict: 'id',
      })
      .select()
      .single()

    if (error) throw error

    return rowToAsset(data)
  } catch (error) {
    console.error('Error saving asset:', error)
    return null
  }
}

// 複数の資産を一括保存
export const saveAssets = async (assets: Asset[]): Promise<Asset[]> => {
  try {
    const rows = assets.map(assetToRow)

    const { data, error } = await supabase
      .from('assets')
      .upsert(rows, {
        onConflict: 'id',
      })
      .select()

    if (error) throw error

    return (data || []).map(rowToAsset)
  } catch (error) {
    console.error('Error saving assets:', error)
    return []
  }
}

// 資産を削除
export const deleteAsset = async (assetId: string): Promise<boolean> => {
  try {
    // まず添付ファイルを削除
    await supabase.from('asset_attachments').delete().eq('asset_id', assetId)

    // 資産を削除
    const { error } = await supabase.from('assets').delete().eq('id', assetId)

    if (error) throw error

    return true
  } catch (error) {
    console.error('Error deleting asset:', error)
    return false
  }
}

