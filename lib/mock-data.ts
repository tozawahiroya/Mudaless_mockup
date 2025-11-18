import type { Asset } from "./types"

const assignees = ["田中", "佐藤", "鈴木", "山田", "高橋"]

export const initialAssets: Asset[] = Array.from({ length: 15 }, (_, i) => {
  const year = 2010 + (i % 10)
  const month = String((i % 12) + 1).padStart(2, "0")
  const day = String(((i * 7) % 28) + 1).padStart(2, "0")
  const assignedTo = assignees[i % assignees.length]

  return {
    id: `${i + 1}`,
    assetNumber: `0101F10000${String(i + 5).padStart(2, "0")}`,
    equipmentName: ["空調機", "配電盤", "照明設備", "換気扇", "ポンプ", "コンプレッサー", "ボイラー", "冷凍機"][i % 8],
    catalogName: "",
    lifespanYears: 15,
    description: "",
    acquisitionAmount: Math.floor(Math.random() * 5000000) + 3000000,
    acquisitionDate: `${year}-${month}-${day}`,
    factory: ["富津工場", "千葉工場", "東京工場"][i % 3],
    building: "",
    floor: "",
    g: null,
    u: null,
    t: null,
    status: "未入力",
    inputBy: assignedTo,
    updatedAt: `2025-11-0${Math.floor(i / 5) + 1} ${10 + (i % 10)}:${String((i * 5) % 60).padStart(2, "0")}`,
    comment: "",
    attachments: [],
    assignedTo,
  }
})

export const factories = ["全て", "富津工場", "千葉工場", "東京工場"]
export const buildings = ["全て", "ものづくり道場", "第一工場", "第二工場", "管理棟"]
export const floors = ["全て", "1F", "2F", "3F", "B1F"]
export const statuses = ["全て", "未入力", "確認待ち", "承認済み", "差し戻し"]
