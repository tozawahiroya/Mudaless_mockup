import { supabase } from './client'

const STORAGE_BUCKET = 'asset-attachments'

// ファイルをアップロード
export const uploadFile = async (
  assetId: string,
  file: File,
  customFileName?: string
): Promise<{ path: string; url: string } | null> => {
  try {
    // ファイル名を生成（重複を避けるため、タイムスタンプを追加）
    const timestamp = Date.now()
    const fileName = customFileName || file.name
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = `${assetId}/${timestamp}_${sanitizedFileName}`

    // ファイルをアップロード
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) throw error

    // 公開URLを取得
    const {
      data: { publicUrl },
    } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath)

    return {
      path: filePath,
      url: publicUrl,
    }
  } catch (error) {
    console.error('Error uploading file:', error)
    return null
  }
}

// 複数のファイルをアップロード
export const uploadFiles = async (
  assetId: string,
  files: File[]
): Promise<Array<{ path: string; url: string; fileName: string }>> => {
  const results = await Promise.all(
    files.map(async (file) => {
      const result = await uploadFile(assetId, file)
      return result
        ? { ...result, fileName: file.name }
        : { path: '', url: '', fileName: file.name }
    })
  )

  return results.filter((r) => r.path !== '')
}

// ファイルを削除
export const deleteFile = async (filePath: string): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([filePath])

    if (error) throw error

    return true
  } catch (error) {
    console.error('Error deleting file:', error)
    return false
  }
}

// ファイルのURLを取得
export const getFileUrl = (filePath: string): string => {
  const {
    data: { publicUrl },
  } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath)

  return publicUrl
}

// 添付ファイル情報をデータベースに保存
export const saveAttachmentRecord = async (
  assetId: string,
  fileName: string,
  filePath: string,
  fileSize: number,
  fileType: string
): Promise<boolean> => {
  try {
    const { error } = await supabase.from('asset_attachments').insert({
      asset_id: assetId,
      file_name: fileName,
      file_path: filePath,
      file_size: fileSize,
      file_type: fileType,
    })

    if (error) throw error

    return true
  } catch (error) {
    console.error('Error saving attachment record:', error)
    return false
  }
}

// 資産の添付ファイル一覧を取得
export const getAssetAttachments = async (
  assetId: string
): Promise<Array<{ fileName: string; filePath: string; url: string }>> => {
  try {
    const { data, error } = await supabase
      .from('asset_attachments')
      .select('file_name, file_path')
      .eq('asset_id', assetId)

    if (error) throw error

    return (data || []).map((attachment) => ({
      fileName: attachment.file_name,
      filePath: attachment.file_path,
      url: getFileUrl(attachment.file_path),
    }))
  } catch (error) {
    console.error('Error fetching attachments:', error)
    return []
  }
}

// 添付ファイルレコードを削除
export const deleteAttachmentRecord = async (
  assetId: string,
  filePath: string
): Promise<boolean> => {
  try {
    // ストレージからファイルを削除
    await deleteFile(filePath)

    // データベースからレコードを削除
    const { error } = await supabase
      .from('asset_attachments')
      .delete()
      .eq('asset_id', assetId)
      .eq('file_path', filePath)

    if (error) throw error

    return true
  } catch (error) {
    console.error('Error deleting attachment record:', error)
    return false
  }
}

