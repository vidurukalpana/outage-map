import type { HistoryDays, OutageType } from '../api/types'
import { OUTAGE_TYPES } from '../lib/outageTypes'

const PERIODS: HistoryDays[] = [7, 30, 90]

interface Props {
  days: HistoryDays
  type: OutageType | null
  onDaysChange: (days: HistoryDays) => void
  onTypeChange: (type: OutageType | null) => void
}

export default function PeriodTypeFilter({ days, type, onDaysChange, onTypeChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex gap-1">
        {PERIODS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onDaysChange(p)}
            aria-pressed={days === p}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              days === p ? 'bg-gray-900 text-white' : 'border border-gray-300 text-gray-700'
            }`}
          >
            {p} days
          </button>
        ))}
      </div>
      <select
        value={type ?? ''}
        onChange={(e) => onTypeChange((e.target.value || null) as OutageType | null)}
        aria-label="Outage type"
        className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
      >
        <option value="">All types</option>
        {OUTAGE_TYPES.map((t) => (
          <option key={t.type} value={t.type}>
            {t.label}
          </option>
        ))}
      </select>
    </div>
  )
}
