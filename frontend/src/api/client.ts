import { getDeviceId } from '../lib/device'
import type { CreateReportRequest, CreateReportResponse } from './types'

const baseUrl = import.meta.env.VITE_API_URL

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(baseUrl + path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    throw new ApiError(res.status, body?.error ?? `Request failed (${res.status})`)
  }
  return body as T
}

export function createReport(req: CreateReportRequest): Promise<CreateReportResponse> {
  return api('/api/reports', {
    method: 'POST',
    headers: { 'X-Device-Id': getDeviceId() },
    body: JSON.stringify(req),
  })
}
