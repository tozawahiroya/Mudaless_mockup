import { NextRequest, NextResponse } from 'next/server'
import { uploadFile, saveAttachmentRecord } from '@/lib/supabase/storage'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const assetId = formData.get('assetId') as string
    const file = formData.get('file') as File

    if (!assetId || !file) {
      return NextResponse.json(
        { error: 'assetId and file are required' },
        { status: 400 }
      )
    }

    // ファイルをアップロード
    const uploadResult = await uploadFile(assetId, file)

    if (!uploadResult) {
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      )
    }

    // データベースに記録を保存
    const saved = await saveAttachmentRecord(
      assetId,
      file.name,
      uploadResult.path,
      file.size,
      file.type
    )

    if (!saved) {
      return NextResponse.json(
        { error: 'Failed to save attachment record' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      path: uploadResult.path,
      url: uploadResult.url,
      fileName: file.name,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

