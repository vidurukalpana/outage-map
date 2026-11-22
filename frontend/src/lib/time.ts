const sriLankaTime = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Colombo',
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
})

// Example: "21 Nov, 7:05 pm" in Sri Lanka time.
export function formatTime(iso: string): string {
  return sriLankaTime.format(new Date(iso))
}

export function timeAgo(iso: string, now = Date.now()): string {
  const minutes = Math.floor((now - new Date(iso).getTime()) / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  return `${Math.floor(hours / 24)} d ago`
}

// Example: "about 3 h" for an average outage length.
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `about ${Math.max(1, Math.round(minutes))} min`
  const hours = Math.round(minutes / 60)
  if (hours < 48) return `about ${hours} h`
  return `about ${Math.round(hours / 24)} d`
}
