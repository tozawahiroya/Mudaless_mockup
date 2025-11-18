// Supabaseデータベースの型定義
// 実際のSupabaseプロジェクトを作成後、`supabase gen types typescript --project-id <project-id>` で生成できます
// 以下は基本的なスキーマの例です

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type AssetStatus = '未入力' | '確認待ち' | '承認済み' | '差し戻し'

export interface Database {
  public: {
    Tables: {
      assets: {
        Row: {
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
          status: AssetStatus
          input_by: string
          assigned_to: string | null
          updated_at: string
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          asset_number: string
          equipment_name: string
          catalog_name?: string | null
          lifespan_years?: number | null
          description?: string | null
          acquisition_amount?: number | null
          acquisition_date: string
          factory: string
          building?: string | null
          floor?: string | null
          g?: number | null
          u?: number | null
          t?: number | null
          status?: AssetStatus
          input_by: string
          assigned_to?: string | null
          updated_at?: string
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          asset_number?: string
          equipment_name?: string
          catalog_name?: string | null
          lifespan_years?: number | null
          description?: string | null
          acquisition_amount?: number | null
          acquisition_date?: string
          factory?: string
          building?: string | null
          floor?: string | null
          g?: number | null
          u?: number | null
          t?: number | null
          status?: AssetStatus
          input_by?: string
          assigned_to?: string | null
          updated_at?: string
          comment?: string | null
        }
      }
      asset_attachments: {
        Row: {
          id: string
          asset_id: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          uploaded_at: string
        }
        Insert: {
          id?: string
          asset_id: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          uploaded_at?: string
        }
        Update: {
          id?: string
          asset_id?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      asset_status: AssetStatus
    }
  }
}

