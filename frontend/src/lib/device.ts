const STORAGE_KEY = 'outagemap-device-id'

let cachedId: string | null = null

// Anonymous ID kept per browser so one person cannot vote twice on a report.
export function getDeviceId(): string {
  if (cachedId) return cachedId
  try {
    cachedId = localStorage.getItem(STORAGE_KEY)
    if (!cachedId) {
      cachedId = crypto.randomUUID()
      localStorage.setItem(STORAGE_KEY, cachedId)
    }
  } catch {
    cachedId ??= crypto.randomUUID()
  }
  return cachedId
}
