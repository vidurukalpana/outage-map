import type { Map as LeafletMap } from 'leaflet'
import { useMemo, useState } from 'react'
import { useMap, useMapEvents } from 'react-leaflet'

interface Point {
  lat: number
  lng: number
}

// Circles closer than this on screen are fanned out so none hides another.
const OVERLAP_PX = 24

function spread(map: LeafletMap, zoom: number, items: Point[]): [number, number][] {
  const points = items.map((p) => map.project([p.lat, p.lng], zoom))
  const groups: number[][] = []
  points.forEach((p, i) => {
    const group = groups.find((g) => points[g[0]].distanceTo(p) < OVERLAP_PX)
    if (group) group.push(i)
    else groups.push([i])
  })

  const positions = items.map((p): [number, number] => [p.lat, p.lng])
  for (const group of groups) {
    if (group.length < 2) continue
    const centre = points[group[0]]
    // Capped so a busy spot stays a small ring instead of spreading across the map.
    const ring = Math.min(14 + 4 * group.length, 40)
    group.forEach((index, k) => {
      const angle = (2 * Math.PI * k) / group.length - Math.PI / 2
      const ll = map.unproject(centre.add([ring * Math.cos(angle), ring * Math.sin(angle)]), zoom)
      positions[index] = [ll.lat, ll.lng]
    })
  }
  return positions
}

// Returns marker positions for the current zoom, fanning out markers that would overlap.
export function useSpreadPositions(items: Point[]): [number, number][] {
  const map = useMap()
  const [zoom, setZoom] = useState(() => map.getZoom())
  useMapEvents({ zoomend: () => setZoom(map.getZoom()) })
  return useMemo(() => spread(map, zoom, items), [map, zoom, items])
}
