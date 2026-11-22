import { CircleMarker, Tooltip } from 'react-leaflet'
import type { HistoryDays, HistorySquare, OutageType } from '../api/types'
import { OUTAGE_TYPES } from '../lib/outageTypes'
import { formatDuration } from '../lib/time'

function mainType(square: HistorySquare) {
  return OUTAGE_TYPES.reduce((best, t) =>
    square.countByType[t.type] > square.countByType[best.type] ? t : best,
  )
}

function radius(count: number): number {
  return Math.min(10 + Math.sqrt(count) * 3, 30)
}

function squareKey(s: HistorySquare): string {
  return `${s.lat},${s.lng}`
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

function TypeChips({ counts }: { counts: Record<OutageType, number> }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {OUTAGE_TYPES.filter((t) => counts[t.type] > 0).map((t) => (
        <span
          key={t.type}
          className="rounded-full px-2 py-0.5 text-xs font-medium"
          style={{ color: t.color, backgroundColor: `${t.color}1A` }}
        >
          {t.icon} {t.label} {counts[t.type]}
        </span>
      ))}
    </div>
  )
}

interface Props {
  squares: HistorySquare[]
  selected: string | null
  onSelect: (key: string, lat: number, lng: number) => void
}

export function AreaMarkers({ squares, selected, onSelect }: Props) {
  return squares.map((s) => (
    <CircleMarker
      key={squareKey(s)}
      center={[s.lat, s.lng]}
      radius={radius(s.count)}
      eventHandlers={{ click: () => onSelect(squareKey(s), s.lat, s.lng) }}
      pathOptions={{
        color: selected === squareKey(s) ? '#111827' : 'white',
        weight: selected === squareKey(s) ? 4 : 2,
        fillColor: mainType(s).color,
        fillOpacity: 0.85,
      }}
    >
      <Tooltip permanent direction="center" className="cluster-count">
        {s.count}
      </Tooltip>
    </CircleMarker>
  ))
}

export function AreaList({ squares, selected, onSelect, days }: Props & { days: HistoryDays }) {
  const total = squares.reduce((sum, s) => sum + s.count, 0)
  const totals = Object.fromEntries(
    OUTAGE_TYPES.map((t) => [t.type, squares.reduce((sum, s) => sum + s.countByType[t.type], 0)]),
  ) as Record<OutageType, number>
  const busiest = squares[0]?.count ?? 1

  return (
    <>
      <section className="space-y-2 rounded-xl bg-gray-50 p-3">
        <p className="text-sm text-gray-500">Last {days} days</p>
        <p className="text-2xl font-bold">
          {plural(total, 'report')}{' '}
          <span className="text-base font-normal text-gray-500">in {plural(squares.length, 'area')}</span>
        </p>
        <TypeChips counts={totals} />
      </section>

      <section>
        <h2 className="mb-1 font-semibold">Busiest areas</h2>
        <ol className="divide-y divide-gray-100">
          {squares.map((s, i) => {
            const main = mainType(s)
            return (
              <li key={squareKey(s)}>
                <button
                  type="button"
                  onClick={() => onSelect(squareKey(s), s.lat, s.lng)}
                  className={`w-full space-y-1.5 rounded-lg px-2 py-2.5 text-left ${selected === squareKey(s) ? 'bg-gray-100' : ''}`}
                >
                  <div className="flex items-baseline gap-2">
                    <span className="w-6 text-sm text-gray-400">#{i + 1}</span>
                    <span className="flex-1 font-semibold">{plural(s.count, 'report')}</span>
                    <span className="text-sm text-gray-500">
                      {s.avgDurationMinutes === null
                        ? 'not resolved yet'
                        : `fixed in ${formatDuration(s.avgDurationMinutes)}`}
                    </span>
                  </div>
                  <div className="ml-8 h-1.5 rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(s.count / busiest) * 100}%`, backgroundColor: main.color }}
                    />
                  </div>
                  <div className="ml-8">
                    <TypeChips counts={s.countByType} />
                  </div>
                </button>
              </li>
            )
          })}
        </ol>
      </section>
    </>
  )
}
