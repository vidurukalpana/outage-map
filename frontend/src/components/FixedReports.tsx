import { CircleMarker, Tooltip } from 'react-leaflet'
import type { HistoryDays, ResolvedReport } from '../api/types'
import { TYPE_INFO } from '../lib/outageTypes'
import { formatDuration, formatTime } from '../lib/time'
import { useSpreadPositions } from '../lib/useSpreadPositions'

interface Props {
  reports: ResolvedReport[]
  selected: string | null
  onSelect: (key: string, lat: number, lng: number) => void
}

export function FixedMarkers({ reports, selected, onSelect }: Props) {
  const positions = useSpreadPositions(reports)
  return reports.map((r, i) => (
    <CircleMarker
      key={r.id}
      center={positions[i]}
      radius={9}
      eventHandlers={{ click: () => onSelect(r.id, r.lat, r.lng) }}
      pathOptions={{
        color: selected === r.id ? '#111827' : 'white',
        weight: selected === r.id ? 4 : 2,
        fillColor: TYPE_INFO[r.type].color,
        fillOpacity: 0.85,
      }}
    >
      <Tooltip>
        {TYPE_INFO[r.type].label} · fixed in {formatDuration(r.durationMinutes)}
      </Tooltip>
    </CircleMarker>
  ))
}

export function FixedList({ reports, selected, onSelect, days }: Props & { days: HistoryDays }) {
  return (
    <section>
      <h2 className="mb-1 font-semibold">
        {reports.length} fixed in the last {days} days
      </h2>
      <ol className="divide-y divide-gray-100">
        {reports.map((r) => {
          const info = TYPE_INFO[r.type]
          return (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => onSelect(r.id, r.lat, r.lng)}
                className={`w-full space-y-1 rounded-lg px-2 py-2.5 text-left ${selected === r.id ? 'bg-gray-100' : ''}`}
              >
                <div className="flex items-baseline gap-2">
                  <span className="flex-1 font-semibold" style={{ color: info.color }}>
                    {info.icon} {info.label}
                  </span>
                  <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                    fixed in {formatDuration(r.durationMinutes)}
                  </span>
                </div>
                <p className={r.note ? 'text-gray-800' : 'text-gray-400 italic'}>{r.note ?? 'No note'}</p>
                <p className="text-xs text-gray-500">
                  Reported {formatTime(r.createdAt)} · Fixed {formatTime(r.resolvedAt)}
                  {r.meTooCount > 0 && ` · ${r.meTooCount} me too`}
                </p>
              </button>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
