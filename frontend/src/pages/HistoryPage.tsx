import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { Map as LeafletMap } from 'leaflet'
import { useState } from 'react'
import { CircleMarker, MapContainer, Tooltip } from 'react-leaflet'
import { getHistory } from '../api/client'
import type { HistoryDays, HistorySquare, OutageType } from '../api/types'
import OsmTileLayer from '../components/OsmTileLayer'
import { OUTAGE_TYPES } from '../lib/outageTypes'
import { SRI_LANKA_CENTER } from '../lib/sriLanka'
import { formatDuration } from '../lib/time'

const PERIODS: HistoryDays[] = [7, 30, 90]

function mainType(square: HistorySquare) {
  return OUTAGE_TYPES.reduce((best, t) =>
    square.countByType[t.type] > square.countByType[best.type] ? t : best,
  )
}

function radius(count: number): number {
  return Math.min(6 + Math.sqrt(count) * 3, 30)
}

export default function HistoryPage() {
  const [days, setDays] = useState<HistoryDays>(30)
  const [type, setType] = useState<OutageType | null>(null)
  const [map, setMap] = useState<LeafletMap | null>(null)

  const { data = [], isPending, isError } = useQuery({
    queryKey: ['history', days, type],
    queryFn: () => getHistory(days, type),
    placeholderData: keepPreviousData,
  })

  return (
    <main className="h-full overflow-y-auto">
      <div className="flex flex-wrap items-center gap-2 bg-white px-3 py-2 shadow">
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setDays(p)}
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
          onChange={(e) => setType((e.target.value || null) as OutageType | null)}
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

      <div className="h-[50dvh]">
        <MapContainer center={SRI_LANKA_CENTER} zoom={7} ref={setMap} className="h-full w-full">
          <OsmTileLayer />
          {data.map((s) => (
            <CircleMarker
              key={`${s.lat},${s.lng}`}
              center={[s.lat, s.lng]}
              radius={radius(s.count)}
              pathOptions={{ color: 'white', weight: 2, fillColor: mainType(s).color, fillOpacity: 0.8 }}
            >
              <Tooltip>
                {s.count} {s.count === 1 ? 'report' : 'reports'}
              </Tooltip>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      <section className="mx-auto max-w-2xl p-3">
        <h2 className="mb-2 font-semibold">Busiest areas · last {days} days</h2>
        {isPending && <p className="text-sm text-gray-500">Loading…</p>}
        {isError && <p className="text-sm text-red-600">Could not load history.</p>}
        {!isPending && !isError && data.length === 0 && (
          <p className="text-sm text-gray-500">No reports in this period.</p>
        )}
        <ol className="divide-y divide-gray-100">
          {data.slice(0, 10).map((s, i) => {
            const main = mainType(s)
            return (
              <li key={`${s.lat},${s.lng}`}>
                <button
                  type="button"
                  onClick={() => map?.flyTo([s.lat, s.lng], 15)}
                  className="flex w-full items-center gap-3 py-2 text-left"
                >
                  <span className="w-5 text-sm text-gray-400">{i + 1}</span>
                  <span className="inline-block size-3 rounded-full" style={{ backgroundColor: main.color }} />
                  <span className="flex-1">
                    <span className="font-medium">
                      {s.count} {s.count === 1 ? 'report' : 'reports'}
                    </span>
                    <span className="text-gray-500"> · mostly {main.label.toLowerCase()}</span>
                  </span>
                  <span className="text-sm text-gray-500">
                    {s.avgDurationMinutes === null ? 'no resolves yet' : formatDuration(s.avgDurationMinutes)}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </section>
    </main>
  )
}
