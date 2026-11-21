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

export interface Cluster {
  type: OutageType
  lat: number
  lng: number
  reportCount: number
  meTooCount: number
  lastActivityAt: string
  reports: ClusterReport[]
}
