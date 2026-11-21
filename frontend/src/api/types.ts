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
