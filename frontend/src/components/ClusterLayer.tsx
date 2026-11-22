import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { LatLngBounds } from 'leaflet'
import { useState } from 'react'
import { CircleMarker, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import { getClusters } from '../api/client'
import type { OutageType } from '../api/types'
import { TYPE_COLOR } from '../lib/outageTypes'
import { SRI_LANKA_BOUNDS } from '../lib/sriLanka'
import ClusterPopup from './ClusterPopup'

// Reports exist only inside Sri Lanka, so the request area is clipped to it.
function toBBox(bounds: LatLngBounds): string | null {
  const minLng = Math.max(bounds.getWest(), SRI_LANKA_BOUNDS.minLng)
  const minLat = Math.max(bounds.getSouth(), SRI_LANKA_BOUNDS.minLat)
  const maxLng = Math.min(bounds.getEast(), SRI_LANKA_BOUNDS.maxLng)
  const maxLat = Math.min(bounds.getNorth(), SRI_LANKA_BOUNDS.maxLat)
  if (minLng >= maxLng || minLat >= maxLat) return null
  return [minLng, minLat, maxLng, maxLat].map((v) => v.toFixed(4)).join(',')
}

function radius(count: number): number {
  return Math.min(10 + count * 2, 30)
}

export default function ClusterLayer({ types }: { types: OutageType[] }) {
  const map = useMap()
  const [bbox, setBBox] = useState(() => toBBox(map.getBounds()))
  useMapEvents({ moveend: () => setBBox(toBBox(map.getBounds())) })

  const { data } = useQuery({
    queryKey: ['clusters', bbox, types],
    queryFn: () => getClusters(bbox!, types),
    enabled: bbox !== null && types.length > 0,
    refetchInterval: 30_000,
    placeholderData: keepPreviousData,
  })

  if (!bbox || types.length === 0) return null

  return data?.map((c) => (
    <CircleMarker
      key={`${c.type}-${c.reports[0].id}`}
      center={[c.lat, c.lng]}
      radius={radius(c.reportCount)}
      bubblingMouseEvents={false}
      pathOptions={{ color: 'white', weight: 2, fillColor: TYPE_COLOR[c.type], fillOpacity: 0.85 }}
    >
      <Tooltip permanent direction="center" className="cluster-count">
        {c.reportCount}
      </Tooltip>
      <ClusterPopup cluster={c} />
    </CircleMarker>
  ))
}
