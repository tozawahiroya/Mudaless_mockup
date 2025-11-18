"use client"

import type React from "react"

import { useState, useCallback } from "react"
import Papa from "papaparse"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Download } from "lucide-react"
import type { Asset } from "@/lib/types"
import { mapCsvRowToAsset } from "@/lib/pseudo-db"

interface FileUploadProps {
  onImport: (assets: Asset[]) => void
}

const isCsvFile = (file: File) => file.name.toLowerCase().endsWith(".csv")

export function FileUpload({ onImport }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importedCount, setImportedCount] = useState<number | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const resetFeedback = useCallback(() => {
    setImportError(null)
    setImportedCount(null)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) {
        if (!isCsvFile(file)) {
          setImportError("CSVファイルを選択してください。")
          return
        }
        setUploadedFile(file)
        resetFeedback()
      }
    },
    [resetFeedback],
  )

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!isCsvFile(file)) {
        setImportError("CSVファイルのみ取り込み可能です。")
        return
      }
      setUploadedFile(file)
      resetFeedback()
    }
  }

  const parseCsvFile = (file: File) => {
    setIsParsing(true)
    setImportError(null)
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: "greedy",
      encoding: "UTF-8",
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        setIsParsing(false)

        if (results.errors.length > 0) {
          setImportError("CSVの解析中にエラーが発生しました。フォーマットをご確認ください。")
          return
        }

        const sanitizedRows = results.data.filter((row) =>
          Object.values(row).some((value) => value?.toString().trim()),
        )

        if (sanitizedRows.length === 0) {
          setImportError("有効なデータ行が見つかりませんでした。")
          return
        }

        const importedAssets = sanitizedRows.map((row, index) => mapCsvRowToAsset(row, index))
        setImportedCount(importedAssets.length)
        onImport(importedAssets)
      },
      error: (error) => {
        setIsParsing(false)
        setImportError(error.message)
      },
    })
  }

  const handleImport = () => {
    if (!uploadedFile) {
      setImportError("CSVファイルを選択してください。")
      return
    }

    if (!uploadedFile.name.toLowerCase().endsWith(".csv")) {
      setImportError("現在はCSVファイルのみ対応しています。")
      return
    }

    parseCsvFile(uploadedFile)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>台帳ファイルの取り込み</CardTitle>
        <CardDescription>
          CSVまたはExcelファイルをアップロードして、固定資産台帳データを一括登録できます
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative flex min-h-[300px] flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50"
          }`}
        >
          <input
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
          <div className="flex flex-col items-center gap-4 text-center">
            {uploadedFile ? (
              <>
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <FileSpreadsheet className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">{uploadedFile.name}</p>
                  <p className="text-sm text-muted-foreground">{(uploadedFile.size / 1024).toFixed(2)} KB</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>ファイルが選択されました</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">ファイルをドラッグ&ドロップ</p>
                  <p className="text-sm text-muted-foreground">または、クリックしてファイルを選択</p>
                </div>
                <p className="text-xs text-muted-foreground">対応形式: CSV, Excel (.xlsx, .xls)</p>
              </>
            )}
          </div>
        </div>

        {importError && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div>
              <p className="font-semibold">インポートに失敗しました</p>
              <p className="mt-1 text-xs text-foreground">{importError}</p>
            </div>
          </div>
        )}

        {importedCount !== null && !importError && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            <CheckCircle2 className="h-4 w-4" />
            <span>{importedCount} 件の資産データを取り込みました</span>
          </div>
        )}

        {uploadedFile && (
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setUploadedFile(null)
                resetFeedback()
              }}
            >
              キャンセル
            </Button>
            <Button onClick={handleImport} disabled={isParsing}>
              {isParsing ? "インポート中..." : "インポート実行"}
            </Button>
          </div>
        )}

        <div className="rounded-lg border bg-card p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h4 className="font-semibold text-foreground">ファイル形式について</h4>
            <Button asChild variant="ghost" size="sm" className="justify-start px-0 text-primary">
              <a href="/data/assets-seed.csv" download>
                <Download className="mr-2 h-4 w-4" />
                サンプルCSVをダウンロード
              </a>
            </Button>
          </div>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• 1行目はヘッダー行として扱われます</li>
            <li>• 必須項目: 資産番号、設備名、カタログ名、寿命年数、工場、建物、フロア</li>
            <li>• 取得金額は数値形式で入力してください</li>
            <li>• ステータスは自動的に「未入力」として登録されます</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
