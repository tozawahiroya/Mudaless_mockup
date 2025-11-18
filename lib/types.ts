export type AssetStatus = "未入力" | "確認待ち" | "承認済み" | "差し戻し"

export interface Asset {
  id: string
  assetNumber: string
  equipmentName: string
  catalogName: string
  lifespanYears: number | null
  description: string
  acquisitionAmount: number | null
  acquisitionDate: string
  factory: string
  building: string
  floor: string
  g: number | null
  u: number | null
  t: number | null
  status: AssetStatus
  inputBy: string
  updatedAt: string
  comment: string
  attachments: string[]
  assignedTo: string
}

export interface FilterState {
  factory: string
  building: string
  floor: string
  status: AssetStatus | "全て"
  search: string
}
