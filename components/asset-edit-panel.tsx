"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Asset } from "@/lib/types"
import { CheckCircle2, XCircle, Save, Upload, X, AlertCircle, Loader2, Camera, Download, FileSpreadsheet } from 'lucide-react'
import { buildings, floors } from "@/lib/mock-data"
import { uploadFile as uploadFileToStorage, saveAttachmentRecord, getAssetAttachments, deleteAttachmentRecord } from "@/lib/supabase/storage"
import { saveAssetToDb } from "@/lib/db"

interface AssetEditPanelProps {
  asset: Asset | null
  onClose: () => void
  onSave: (asset: Asset) => void
  onApprove?: (assetId: string, asset: Asset) => void
  onReject?: (assetId: string, comment: string) => void
  viewMode: "customer" | "mudaless"
}

export function AssetEditPanel({ asset, onClose, onSave, onApprove, onReject, viewMode }: AssetEditPanelProps) {
  const [editedAsset, setEditedAsset] = useState<Asset | null>(null)
  const [rejectComment, setRejectComment] = useState("")
  const [validationErrors, setValidationErrors] = useState<{ building?: boolean; floor?: boolean }>({})
  const [gutValidationErrors, setGutValidationErrors] = useState<{ g?: boolean; u?: boolean; t?: boolean }>({})
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set())
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [attachmentUrls, setAttachmentUrls] = useState<Record<string, string>>({})
  const [showCamera, setShowCamera] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pendingFilesRef = useRef<File[]>([])

  useEffect(() => {
    setEditedAsset(asset)
    setRejectComment("")
    setValidationErrors({})
    setGutValidationErrors({})
    if (asset) {
      loadAttachmentUrls(asset.id)
    }
  }, [asset])

  // カメラモーダルが開いたときにストリームを開始
  useEffect(() => {
    if (showCamera) {
      // モーダルが開いた後、少し待ってからストリームを開始（video要素がマウントされるまで待つ）
      const timer = setTimeout(() => {
        if (videoRef.current && navigator.mediaDevices) {
          navigator.mediaDevices
            .getUserMedia({ video: { facingMode: 'environment' } })
            .then((stream) => {
              if (videoRef.current) {
                videoRef.current.srcObject = stream
              }
            })
            .catch((error) => {
              console.error('カメラへのアクセスエラー:', error)
              setShowCamera(false)
            })
        }
      }, 100)

      return () => clearTimeout(timer)
    } else if (videoRef.current?.srcObject) {
      // モーダルが閉じられたときにストリームを停止
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
  }, [showCamera])

  const loadAttachmentUrls = async (assetId: string) => {
    try {
      const attachments = await getAssetAttachments(assetId)
      const urlMap: Record<string, string> = {}
      attachments.forEach((att) => {
        urlMap[att.fileName] = att.url
      })
      setAttachmentUrls(urlMap)
      // ファイル名のリストも更新（データベースから取得した正確なファイル名を使用）
      if (editedAsset) {
        const dbFileNames = attachments.map((att) => att.fileName)
        setEditedAsset({
          ...editedAsset,
          attachments: dbFileNames.length > 0 ? dbFileNames : editedAsset.attachments,
        })
      }
    } catch (error) {
      console.error('Error loading attachment URLs:', error)
    }
  }

  const isImageFile = (fileName: string) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName)
  }

  const isExcelOrCsvFile = (fileName: string) => {
    return /\.(xlsx|xls|csv)$/i.test(fileName)
  }

  const handleTakePhoto = () => {
    // PCでもカメラを直接起動できるようにgetUserMediaを使用
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      // まずモーダルを開く（useEffectでストリームが開始される）
      setShowCamera(true)
    } else {
      // フォールバック: モバイル用のファイル選択
      if (cameraInputRef.current) {
        cameraInputRef.current.setAttribute('capture', 'environment')
        cameraInputRef.current.click()
      }
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !editedAsset) return

    const canvas = canvasRef.current
    const video = videoRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(video, 0, 0)
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' })
          const fileName = file.name
          const newFileNames = [fileName]
          setEditedAsset({
            ...editedAsset,
            attachments: [...editedAsset.attachments, ...newFileNames],
          })
          uploadFile(file, fileName)
        }
      }, 'image/jpeg', 0.9)
    }

    // カメラストリームを停止
    if (video.srcObject) {
      const stream = video.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      video.srcObject = null
    }
    setShowCamera(false)
  }

  const cancelCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
    setShowCamera(false)
  }

  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editedAsset) return

    const fileName = `photo_${Date.now()}.jpg`
    const newFileNames = [fileName]
    setEditedAsset({
      ...editedAsset,
      attachments: [...editedAsset.attachments, ...newFileNames],
    })

    await uploadFile(file, fileName)

    if (cameraInputRef.current) {
      cameraInputRef.current.value = ""
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !editedAsset) return

    const fileArray = Array.from(files)
    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

    // ファイルサイズチェック
    const oversizedFiles = fileArray.filter((file) => file.size > MAX_FILE_SIZE)
    if (oversizedFiles.length > 0) {
      alert(
        `以下のファイルが10MBを超えています:\n${oversizedFiles.map((f) => f.name).join('\n')}\n\n10MB以下のファイルのみアップロードできます。`
      )
      const validFiles = fileArray.filter((file) => file.size <= MAX_FILE_SIZE)
      if (validFiles.length === 0) {
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
        return
      }
      fileArray.splice(0, fileArray.length, ...validFiles)
    }

    pendingFilesRef.current = [...pendingFilesRef.current, ...fileArray]

    // まずファイル名を表示（即座にフィードバック）
    const newFileNames = fileArray.map((file) => file.name)
    setEditedAsset({
      ...editedAsset,
      attachments: [...editedAsset.attachments, ...newFileNames],
    })

    // ファイルをアップロード
    for (const file of fileArray) {
      await uploadFile(file)
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const uploadFile = async (file: File, customFileName?: string) => {
    if (!editedAsset) return

    const fileName = customFileName || file.name
    setUploadingFiles((prev) => new Set(prev).add(fileName))
    setUploadProgress((prev) => ({ ...prev, [fileName]: 0 }))

    try {
      // ファイル名を変更（カメラ撮影の場合）
      const fileToUpload = customFileName
        ? new File([file], customFileName, { type: file.type })
        : file

      // Supabase Storageにアップロード
      const uploadResult = await uploadFileToStorage(editedAsset.id, fileToUpload)

      if (!uploadResult) {
        throw new Error('Upload failed')
      }

      // データベースに記録を保存
      const saved = await saveAttachmentRecord(
        editedAsset.id,
        fileName,
        uploadResult.path,
        file.size,
        file.type
      )

      if (!saved) {
        console.warn('File uploaded but failed to save record')
      }

      // URLを取得して保存
      setAttachmentUrls((prev) => ({
        ...prev,
        [fileName]: uploadResult.url,
      }))

      // アップロード成功
      setUploadProgress((prev) => ({ ...prev, [fileName]: 100 }))
    } catch (error) {
      console.error('Error uploading file:', error)
      // エラー時はファイル名をリストから削除
      setEditedAsset((prev) => {
        if (!prev) return null
        return {
          ...prev,
          attachments: prev.attachments.filter((name) => name !== fileName),
        }
      })
    } finally {
      setUploadingFiles((prev) => {
        const next = new Set(prev)
        next.delete(fileName)
        return next
      })
    }
  }

  const handleRemoveFile = async (index: number) => {
    if (!editedAsset) return

    const fileName = editedAsset.attachments[index]
    
    // UIから即座に削除
    const newAttachments = editedAsset.attachments.filter((_, i) => i !== index)
    setEditedAsset({
      ...editedAsset,
      attachments: newAttachments,
    })

    // Supabaseからファイルを削除
    try {
      // ファイルパスを取得
      const attachments = await getAssetAttachments(editedAsset.id)
      const attachment = attachments.find((a) => a.fileName === fileName)
      
      if (attachment) {
        await deleteAttachmentRecord(editedAsset.id, attachment.filePath)
      }
    } catch (error) {
      console.error('Error deleting file:', error)
    }
  }

  const handleSave = async () => {
    const errors: { building?: boolean; floor?: boolean } = {}

    if (!editedAsset.building) {
      errors.building = true
    }
    if (!editedAsset.floor) {
      errors.floor = true
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }

    const updatedAsset = {
      ...editedAsset,
      status: "確認待ち" as Asset["status"],
      updatedAt: new Date().toLocaleString("ja-JP"),
    }
    
    // Supabaseに直接保存（他のデバイスに即座に反映）
    const result = await saveAssetToDb(updatedAsset)
    
    if (result.conflict) {
      // 競合が発生した場合、最新データを表示
      alert('他のデバイスでこの資産が更新されました。最新の情報を表示します。')
      if (result.asset) {
        setEditedAsset(result.asset)
        onSave(result.asset)
      }
      // パネルは閉じずに最新データを表示
      return
    }
    
    // 親コンポーネントの状態も更新
    if (result.asset) {
      onSave(result.asset)
    } else {
      onSave(updatedAsset)
    }
    onClose()
  }

  const handleApprove = async () => {
    const gutErrors: { g?: boolean; u?: boolean; t?: boolean } = {}

    if (!editedAsset.g) {
      gutErrors.g = true
    }
    if (!editedAsset.u) {
      gutErrors.u = true
    }
    if (!editedAsset.t) {
      gutErrors.t = true
    }

    if (Object.keys(gutErrors).length > 0) {
      setGutValidationErrors(gutErrors)
      return
    }

    const approvedAsset = {
      ...editedAsset,
      status: "承認済み" as Asset["status"],
      updatedAt: new Date().toLocaleString("ja-JP"),
    }
    
    // Supabaseに直接保存（他のデバイスに即座に反映）
    const result = await saveAssetToDb(approvedAsset)
    
    if (result.conflict) {
      // 競合が発生した場合、最新データを表示
      alert('他のデバイスでこの資産が更新されました。最新の情報を表示します。')
      if (result.asset) {
        setEditedAsset(result.asset)
      }
      // パネルは閉じずに最新データを表示
      return
    }
    
    if (onApprove) {
      const assetToApprove = result.asset || approvedAsset
      onApprove(editedAsset.id, assetToApprove)
      onClose()
    }
  }

  const handleReject = async () => {
    if (!rejectComment.trim()) {
      alert("差し戻しの理由を入力してください")
      return
    }
    
    const rejectedAsset = {
      ...editedAsset,
      status: "差し戻し" as Asset["status"],
      comment: rejectComment,
      updatedAt: new Date().toLocaleString("ja-JP"),
    }
    
    // Supabaseに直接保存（他のデバイスに即座に反映）
    const result = await saveAssetToDb(rejectedAsset)
    
    if (result.conflict) {
      // 競合が発生した場合、最新データを表示
      alert('他のデバイスでこの資産が更新されました。最新の情報を表示します。')
      if (result.asset) {
        setEditedAsset(result.asset)
      }
      // パネルは閉じずに最新データを表示
      return
    }
    
    if (onReject) {
      onReject(editedAsset.id, rejectComment)
      onClose()
    }
  }

  if (!editedAsset) return null

  const canEdit = viewMode === "customer" && (editedAsset.status === "未入力" || editedAsset.status === "差し戻し")
  const canReview = viewMode === "mudaless" && editedAsset.status === "確認待ち"

  return (
    <>
      <Sheet open={!!asset} onOpenChange={onClose}>
        <SheetContent className="w-full overflow-y-auto px-4 sm:px-6 sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>資産詳細</SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {Object.keys(validationErrors).length > 0 && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
                <div className="flex-1">
                  <h4 className="font-semibold text-destructive">入力エラー</h4>
                  <p className="mt-1 text-sm text-foreground">以下の必須項目を入力してください：</p>
                  <ul className="mt-2 list-inside list-disc text-sm text-foreground">
                    {validationErrors.building && <li>建物</li>}
                    {validationErrors.floor && <li>フロア</li>}
                  </ul>
                </div>
              </div>
            )}

            {Object.keys(gutValidationErrors).length > 0 && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
                <div className="flex-1">
                  <h4 className="font-semibold text-destructive">GUT評価エラー</h4>
                  <p className="mt-1 text-sm text-foreground">承認するには以下のGUT評価を入力してください：</p>
                  <ul className="mt-2 list-inside list-disc text-sm text-foreground">
                    {gutValidationErrors.g && <li>G（重大性）</li>}
                    {gutValidationErrors.u && <li>U（緊急性）</li>}
                    {gutValidationErrors.t && <li>T（拡大性）</li>}
                  </ul>
                </div>
              </div>
            )}

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="assetNumber">資産番号</Label>
                <Input id="assetNumber" value={editedAsset.assetNumber} disabled />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="equipmentName">設備名</Label>
                <Input id="equipmentName" value={editedAsset.equipmentName} disabled />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="catalogName">
                  カタログ名 {canEdit && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="catalogName"
                  value={editedAsset.catalogName}
                  onChange={(e) => setEditedAsset({ ...editedAsset, catalogName: e.target.value })}
                  disabled={!canEdit}
                  placeholder={canEdit ? "カタログ名を入力" : ""}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">
                  説明 {canEdit && <span className="text-destructive">*</span>}
                </Label>
                <Textarea
                  id="description"
                  value={editedAsset.description}
                  onChange={(e) => setEditedAsset({ ...editedAsset, description: e.target.value })}
                  disabled={!canEdit}
                  rows={3}
                  placeholder={canEdit ? "説明を入力" : ""}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="acquisitionDate">取得年月日</Label>
                  <Input id="acquisitionDate" type="date" value={editedAsset.acquisitionDate} disabled />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="lifespanYears">寿命年数</Label>
                  <Input id="lifespanYears" type="number" value={editedAsset.lifespanYears || ""} disabled />
                </div>
              </div>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="acquisitionAmount">取得金額</Label>
                  <Input id="acquisitionAmount" type="number" value={editedAsset.acquisitionAmount || ""} disabled />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="factory">工場</Label>
                  <Input id="factory" value={editedAsset.factory} disabled />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="building" className={validationErrors.building ? "text-destructive" : ""}>
                    建物 <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={editedAsset.building}
                    onValueChange={(value) => {
                      setEditedAsset({ ...editedAsset, building: value })
                      setValidationErrors((prev) => ({ ...prev, building: false }))
                    }}
                    disabled={!canEdit}
                  >
                    <SelectTrigger id="building" className={validationErrors.building ? "border-destructive" : ""}>
                      <SelectValue placeholder="建物を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {buildings
                        .filter((b) => b !== "全て")
                        .map((building) => (
                          <SelectItem key={building} value={building}>
                            {building}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="floor" className={validationErrors.floor ? "text-destructive" : ""}>
                    フロア <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={editedAsset.floor}
                    onValueChange={(value) => {
                      setEditedAsset({ ...editedAsset, floor: value })
                      setValidationErrors((prev) => ({ ...prev, floor: false }))
                    }}
                    disabled={!canEdit}
                  >
                    <SelectTrigger id="floor" className={validationErrors.floor ? "border-destructive" : ""}>
                      <SelectValue placeholder="フロアを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {floors
                        .filter((f) => f !== "全て")
                        .map((floor) => (
                          <SelectItem key={floor} value={floor}>
                            {floor}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {canEdit && (
                <div className="grid gap-2">
                  <Label htmlFor="attachments">添付ファイル（写真・Excel）</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.xlsx,.xls,.csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleCameraCapture}
                    className="hidden"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-transparent"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      ファイルを選択
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-transparent"
                      onClick={handleTakePhoto}
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      写真を撮る
                    </Button>
                  </div>
                  {editedAsset.attachments.length > 0 && (
                    <div className="space-y-2">
                      {editedAsset.attachments.map((fileName, index) => {
                        const isUploading = uploadingFiles.has(fileName)
                        const progress = uploadProgress[fileName] || 0
                        const fileUrl = attachmentUrls[fileName]
                        const isImage = isImageFile(fileName)
                        return (
                          <div
                            key={index}
                            className="rounded-md border bg-muted/50 overflow-hidden"
                          >
                            <div className="flex items-center justify-between px-3 py-2 text-sm">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {isUploading ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-primary flex-shrink-0" />
                                ) : (
                                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                                )}
                                <span className="truncate">{fileName}</span>
                                {isUploading && (
                                  <span className="text-xs text-muted-foreground ml-auto">
                                    {progress}%
                                  </span>
                                )}
                              </div>
                              {!isUploading && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 flex-shrink-0"
                                  onClick={() => handleRemoveFile(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            {!isUploading && isImage && fileUrl && (
                              <div className="px-3 pb-2">
                                <img
                                  src={fileUrl}
                                  alt={fileName}
                                  className="w-full max-h-64 object-contain rounded border bg-muted"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none'
                                  }}
                                />
                              </div>
                            )}
                            {!isUploading && isExcelOrCsvFile(fileName) && fileUrl && (
                              <div className="px-3 pb-2">
                                <a
                                  href={fileUrl}
                                  download={fileName}
                                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                                >
                                  <FileSpreadsheet className="h-4 w-4" />
                                  <span>ダウンロード</span>
                                  <Download className="h-3 w-3 ml-auto" />
                                </a>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {!canEdit && editedAsset.attachments.length > 0 && (
                <div className="grid gap-2">
                  <Label>添付ファイル</Label>
                  <div className="space-y-2">
                    {editedAsset.attachments.map((fileName, index) => {
                      const fileUrl = attachmentUrls[fileName]
                      const isImage = isImageFile(fileName)
                      return (
                        <div key={index} className="rounded-md border bg-muted/50 overflow-hidden">
                          <div className="px-3 py-2 text-sm">{fileName}</div>
                          {isImage && fileUrl && (
                            <div className="px-3 pb-2">
                              <img
                                src={fileUrl}
                                alt={fileName}
                                className="w-full max-h-64 object-contain rounded border bg-muted"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            </div>
                          )}
                          {isExcelOrCsvFile(fileName) && fileUrl && (
                            <div className="px-3 pb-2">
                              <a
                                href={fileUrl}
                                download={fileName}
                                className="flex items-center gap-2 text-sm text-primary hover:underline"
                              >
                                <FileSpreadsheet className="h-4 w-4" />
                                <span>ダウンロード</span>
                                <Download className="h-3 w-3 ml-auto" />
                              </a>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="rounded-lg border bg-muted/30 p-3 sm:p-4">
                <h4 className="mb-3 font-semibold text-foreground">GUT評価</h4>
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="g" className={gutValidationErrors.g ? "text-destructive" : ""}>
                      G (重大性) {canReview && <span className="text-destructive">*</span>}
                    </Label>
                    <Input
                      id="g"
                      type="number"
                      min="1"
                      max="5"
                      value={editedAsset.g || ""}
                      onChange={(e) => {
                        setEditedAsset({
                          ...editedAsset,
                          g: e.target.value ? Number.parseInt(e.target.value) : null,
                        })
                        setGutValidationErrors((prev) => ({ ...prev, g: false }))
                      }}
                      disabled={!canReview}
                      placeholder={canReview ? "1-5" : ""}
                      className={gutValidationErrors.g ? "border-destructive" : ""}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="u" className={gutValidationErrors.u ? "text-destructive" : ""}>
                      U (緊急性) {canReview && <span className="text-destructive">*</span>}
                    </Label>
                    <Input
                      id="u"
                      type="number"
                      min="1"
                      max="5"
                      value={editedAsset.u || ""}
                      onChange={(e) => {
                        setEditedAsset({
                          ...editedAsset,
                          u: e.target.value ? Number.parseInt(e.target.value) : null,
                        })
                        setGutValidationErrors((prev) => ({ ...prev, u: false }))
                      }}
                      disabled={!canReview}
                      placeholder={canReview ? "1-5" : ""}
                      className={gutValidationErrors.u ? "border-destructive" : ""}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="t" className={gutValidationErrors.t ? "text-destructive" : ""}>
                      T (拡大性) {canReview && <span className="text-destructive">*</span>}
                    </Label>
                    <Input
                      id="t"
                      type="number"
                      min="1"
                      max="5"
                      value={editedAsset.t || ""}
                      onChange={(e) => {
                        setEditedAsset({
                          ...editedAsset,
                          t: e.target.value ? Number.parseInt(e.target.value) : null,
                        })
                        setGutValidationErrors((prev) => ({ ...prev, t: false }))
                      }}
                      disabled={!canReview}
                      placeholder={canReview ? "1-5" : ""}
                      className={gutValidationErrors.t ? "border-destructive" : ""}
                    />
                  </div>
                </div>
                {editedAsset.g && editedAsset.u && editedAsset.t && (
                  <div className="mt-3 text-center">
                    <span className="text-sm text-muted-foreground">GUTスコア: </span>
                    <span className="text-lg font-bold text-primary">
                      {editedAsset.g * editedAsset.u * editedAsset.t}
                    </span>
                  </div>
                )}
              </div>

              {canReview && (
                <div className="grid gap-2">
                  <Label htmlFor="comment">コメント</Label>
                  <Textarea
                    id="comment"
                    value={editedAsset.comment}
                    onChange={(e) => setEditedAsset({ ...editedAsset, comment: e.target.value })}
                    rows={3}
                    placeholder="コメントを入力（任意）"
                  />
                </div>
              )}

              {canReview && (
                <div className="grid gap-2">
                  <Label htmlFor="rejectComment">差し戻し理由</Label>
                  <Textarea
                    id="rejectComment"
                    value={rejectComment}
                    onChange={(e) => setRejectComment(e.target.value)}
                    rows={3}
                    placeholder="差し戻す場合は理由を入力してください（必須）"
                  />
                </div>
              )}

              {editedAsset.status === "差し戻し" && editedAsset.comment && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                  <h4 className="mb-2 font-semibold text-destructive">差し戻し理由</h4>
                  <p className="text-sm text-foreground">{editedAsset.comment}</p>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>ステータス</Label>
                  <div className="flex h-10 items-center rounded-md border bg-muted px-3 text-sm">
                    {editedAsset.status}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>担当者</Label>
                  <div className="flex h-10 items-center rounded-md border bg-muted px-3 text-sm">
                    {editedAsset.assignedTo || "-"}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>入力者</Label>
                  <div className="flex h-10 items-center rounded-md border bg-muted px-3 text-sm">
                    {editedAsset.inputBy || "-"}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>更新日時</Label>
                  <div className="flex h-10 items-center rounded-md border bg-muted px-3 text-sm">
                    {editedAsset.updatedAt}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row">
              {canEdit && (
                <>
                  <Button onClick={handleSave} className="flex-1">
                    <Save className="mr-2 h-4 w-4" />
                    登録する
                  </Button>
                  <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
                    キャンセル
                  </Button>
                </>
              )}

              {canReview && (
                <>
                  <Button onClick={handleApprove} className="flex-1">
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    承認する
                  </Button>
                  <Button variant="destructive" onClick={handleReject} className="flex-1">
                    <XCircle className="mr-2 h-4 w-4" />
                    差し戻す
                  </Button>
                </>
              )}

              {!canEdit && !canReview && (
                <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
                  閉じる
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* カメラプレビューダイアログ */}
      <Dialog open={showCamera} onOpenChange={setShowCamera}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>写真を撮る</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            <div className="flex gap-2">
              <Button onClick={cancelCamera} variant="outline" className="flex-1">
                キャンセル
              </Button>
              <Button onClick={capturePhoto} className="flex-1">
                <Camera className="mr-2 h-4 w-4" />
                撮影
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
