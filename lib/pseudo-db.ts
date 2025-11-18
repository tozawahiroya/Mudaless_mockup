import type { Asset, AssetStatus } from "./types"
import { initialAssets } from "./mock-data"

const STORAGE_KEY = "asset-ledger-demo-assets:v1"

const allowedStatuses: AssetStatus[] = ["未入力", "確認待ち", "承認済み", "差し戻し"]

const csvHeaders = [
  "資産番号",
  "取得年月日",
  "取得金額",
  "寿命年数",
  "設備名",
  "工場",
  "カタログ名",
  "説明",
  "建物",
  "フロア",
  "G",
  "U",
  "T",
  "ステータス",
  "入力者",
  "担当者",
  "更新日時",
] as const

const sanitizeNumber = (value?: string) => {
  if (!value) return null
  const normalized = value.replace(/,/g, "").trim()
  if (!normalized) return null
  const parsed = Number.parseInt(normalized, 10)
  return Number.isFinite(parsed) ? parsed : null
}

const sanitizeScore = (value?: string) => {
  const parsed = sanitizeNumber(value)
  if (parsed === null) return null
  if (parsed < 1 || parsed > 5) return null
  return parsed
}

const sanitizeStatus = (value?: string): AssetStatus => {
  if (value && allowedStatuses.includes(value as AssetStatus)) {
    return value as AssetStatus
  }
  return "未入力"
}

const ensureAssetShape = (asset: Asset): Asset => ({
  ...asset,
  id: asset.id || asset.assetNumber,
  catalogName: asset.catalogName ?? "",
  description: asset.description ?? "",
  building: asset.building ?? "",
  floor: asset.floor ?? "",
  g: asset.g ?? null,
  u: asset.u ?? null,
  t: asset.t ?? null,
  acquisitionAmount: asset.acquisitionAmount ?? null,
  lifespanYears: asset.lifespanYears ?? null,
  attachments: asset.attachments ?? [],
  comment: asset.comment ?? "",
  assignedTo: asset.assignedTo ?? asset.inputBy ?? "",
})

export const loadAssetsFromStorage = (): Asset[] => {
  if (typeof window === "undefined") {
    return initialAssets
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initialAssets))
      return initialAssets
    }
    const parsed = JSON.parse(stored) as Asset[]
    return parsed.map(ensureAssetShape)
  } catch {
    window.localStorage.removeItem(STORAGE_KEY)
    return initialAssets
  }
}

export const persistAssetsToStorage = (assets: Asset[]) => {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(assets.map(ensureAssetShape)))
}

export const resetPseudoDb = () => {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(STORAGE_KEY)
}

export const assetsToCsv = (assets: Asset[]) => {
  const rows = assets.map((asset) => {
    const values = csvHeaders.map((header) => {
      switch (header) {
        case "資産番号":
          return asset.assetNumber
        case "取得年月日":
          return asset.acquisitionDate
        case "取得金額":
          return asset.acquisitionAmount ?? ""
        case "寿命年数":
          return asset.lifespanYears ?? ""
        case "設備名":
          return asset.equipmentName
        case "工場":
          return asset.factory
        case "カタログ名":
          return asset.catalogName
        case "説明":
          return asset.description
        case "建物":
          return asset.building
        case "フロア":
          return asset.floor
        case "G":
          return asset.g ?? ""
        case "U":
          return asset.u ?? ""
        case "T":
          return asset.t ?? ""
        case "ステータス":
          return asset.status
        case "入力者":
          return asset.inputBy
        case "担当者":
          return asset.assignedTo
        case "更新日時":
          return asset.updatedAt
        default:
          return ""
      }
    })
    return values
      .map((value) => {
        const stringified = `${value ?? ""}`
        if (stringified.includes(",") || stringified.includes('"')) {
          return `"${stringified.replace(/"/g, '""')}"`
        }
        return stringified
      })
      .join(",")
  })

  return [csvHeaders.join(","), ...rows].join("\n")
}

export type CsvRow = Record<string, string>

export const mapCsvRowToAsset = (row: CsvRow, index: number): Asset => {
  const assetNumber = row["資産番号"]?.trim() || `CSV-${index + 1}`
  const now = new Date().toLocaleString("ja-JP")
  return ensureAssetShape({
    id: assetNumber,
    assetNumber,
    acquisitionDate: row["取得年月日"]?.trim() || "",
    acquisitionAmount: sanitizeNumber(row["取得金額"]),
    lifespanYears: sanitizeNumber(row["寿命年数"]),
    equipmentName: row["設備名"]?.trim() || "",
    factory: row["工場"]?.trim() || "",
    catalogName: row["カタログ名"]?.trim() || "",
    description: row["説明"]?.trim() || "",
    building: row["建物"]?.trim() || "",
    floor: row["フロア"]?.trim() || "",
    g: sanitizeScore(row["G"]),
    u: sanitizeScore(row["U"]),
    t: sanitizeScore(row["T"]),
    status: sanitizeStatus(row["ステータス"]),
    inputBy: row["入力者"]?.trim() || "未入力",
    assignedTo: row["担当者"]?.trim() || row["入力者"]?.trim() || "",
    attachments: [],
    comment: row["コメント"]?.trim() || "",
    updatedAt: row["更新日時"]?.trim() || now,
  })
}

