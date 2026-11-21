import type { OutageType } from '../api/types'

export const OUTAGE_TYPES: { type: OutageType; label: string; icon: string; color: string }[] = [
  { type: 'power', label: 'Power', icon: '⚡', color: '#CA8A04' },
  { type: 'water', label: 'Water', icon: '💧', color: '#2563EB' },
  { type: 'internet', label: 'Internet', icon: '📶', color: '#7C3AED' },
  { type: 'road', label: 'Blocked road', icon: '🚧', color: '#DC2626' },
]

export const TYPE_COLOR = Object.fromEntries(OUTAGE_TYPES.map((t) => [t.type, t.color])) as Record<
  OutageType,
  string
>
