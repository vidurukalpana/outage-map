import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { Map as LeafletMap } from 'leaflet'
import { useState } from 'react'
import { MapContainer } from 'react-leaflet'
import { useSearchParams } from 'react-router'
import { getHistory, getResolved } from '../api/client'
import type { HistoryDays, HistorySquare, OutageType, ResolvedReport } from '../api/types'
import { FixedList, FixedMarkers } from '../components/FixedReports'
import { AreaList, AreaMarkers } from '../components/HistoryAreas'
import MapSearch from '../components/MapSearch'
import OsmTileLayer from '../components/OsmTileLayer'
import PeriodTypeFilter from '../components/PeriodTypeFilter'
import { SRI_LANKA_CENTER } from '../lib/sriLanka'

const NO_SQUARES: HistorySquare[] = []
const NO_REPORTS: ResolvedReport[] = []

const VIEWS = [
  { id: 'areas', label: 'Busiest areas' },
  { id: 'fixed', label: 'Fixed' },
] as const

export default function HistoryPage() {
  const [params, setParams] = useSearchParams()
  const view = params.get('view') === 'fixed' ? 'fixed' : 'areas'
  const [days, setDays] = useState<HistoryDays>(30)
  const [type, setType] = useState<OutageType | null>(null)
  const [map, setMap] = useState<LeafletMap | null>(null)
  const [selected, setSelected] = useState<string | null>(null)

  const areas = useQuery({
    queryKey: ['history', days, type],
    queryFn: () => getHistory(days, type),
    enabled: view === 'areas',
    placeholderData: keepPreviousData,
  })
  const fixed = useQuery({
    queryKey: ['resolved', days, type],
    queryFn: () => getResolved(days, type),
    enabled: view === 'fixed',
    placeholderData: keepPreviousData,
  })
  const active = view === 'areas' ? areas : fixed
  const squares = areas.data ?? NO_SQUARES
  const reports = fixed.data ?? NO_REPORTS
  const isEmpty = view === 'areas' ? squares.length === 0 : reports.length === 0

  function showView(id: (typeof VIEWS)[number]['id']) {
    setSelected(null)
    setParams(id === 'fixed' ? { view: 'fixed' } : {})
  }

  function zoomTo(key: string, lat: number, lng: number) {
    setSelected(key)
    map?.flyTo([lat, lng], 15)
  }

  return (
    <main className="flex h-full flex-col md:flex-row">
      <div className="h-[45dvh] shrink-0 md:h-full md:flex-1">
        <MapContainer center={SRI_LANKA_CENTER} zoom={8} ref={setMap} className="h-full w-full">
          <OsmTileLayer />
          <MapSearch />
          {view === 'areas' ? (
            <AreaMarkers squares={squares} selected={selected} onSelect={zoomTo} />
          ) : (
            <FixedMarkers reports={reports} selected={selected} onSelect={zoomTo} />
          )}
        </MapContainer>
      </div>

      <aside className="min-h-0 flex-1 space-y-4 overflow-y-auto border-gray-200 bg-white p-4 md:w-[26rem] md:flex-none md:border-l">
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1" role="tablist">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              role="tab"
              aria-selected={view === v.id}
              onClick={() => showView(v.id)}
              className={`rounded-lg py-1.5 text-sm font-medium ${
                view === v.id ? 'bg-white text-gray-900 shadow' : 'text-gray-600'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        <PeriodTypeFilter days={days} type={type} onDaysChange={setDays} onTypeChange={setType} />

        {active.isPending && <p className="text-sm text-gray-500">Loading…</p>}
        {active.isError && <p className="text-sm text-red-600">Could not load history.</p>}
        {active.isSuccess && isEmpty && (
          <p className="text-sm text-gray-500">
            {view === 'areas' ? 'No reports in this period.' : 'Nothing was marked fixed in this period.'}
          </p>
        )}

        {view === 'areas' && squares.length > 0 && (
          <AreaList
            squares={squares}
            days={days}
            selected={selected}
            onSelect={zoomTo}
          />
        )}
        {view === 'fixed' && reports.length > 0 && (
          <FixedList reports={reports} days={days} selected={selected} onSelect={zoomTo} />
        )}
      </aside>
    </main>
  )
}
