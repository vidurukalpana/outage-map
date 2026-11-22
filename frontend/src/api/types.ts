export type OutageType = 'power' | 'water' | 'internet' | 'road'

export interface CreateReportRequest {
  type: OutageType
  lat: number
  lng: number
  note?: string
}

export interface CreateReportResponse {
  id: string
}

export interface ClusterReport {
  id: string
  note: string | null
  createdAt: string
  meTooCount: number
}

export type HistoryDays = 7 | 30 | 90

export interface HistorySquare {
  lat: number
  lng: number
  count: number
  countByType: Record<OutageType, number>
  avgDurationMinutes: number | null
}

export interface Cluster {
  type: OutageType
  lat: number
  lng: number
  reportCount: number
  meTooCount: number
  lastActivityAt: string
  reports: ClusterReport[]
}
