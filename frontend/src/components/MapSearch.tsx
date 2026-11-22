import { DomEvent } from 'leaflet'
import { useEffect, useRef, useState } from 'react'
import { useMap, useMapEvents } from 'react-leaflet'

// OpenStreetMap's free place search; its policy allows searches on submit only, not per keystroke.
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'

interface Place {
  place_id: number
  display_name: string
  boundingbox: [string, string, string, string]
}

export default function MapSearch() {
  const map = useMap()
  const boxRef = useRef<HTMLFormElement>(null)
  const [query, setQuery] = useState('')
  const [places, setPlaces] = useState<Place[]>([])
  const [status, setStatus] = useState<'idle' | 'searching' | 'none' | 'error'>('idle')
  useMapEvents({ click: () => setPlaces([]) })

  // Taps on the search box must not reach the map underneath, which would open the report form.
  useEffect(() => {
    if (!boxRef.current) return
    DomEvent.disableClickPropagation(boxRef.current)
    DomEvent.disableScrollPropagation(boxRef.current)
  }, [])

  function goTo(place: Place) {
    const [south, north, west, east] = place.boundingbox.map(Number)
    map.flyToBounds(
      [
        [south, west],
        [north, east],
      ],
      { maxZoom: 16 },
    )
  }

  async function search(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    setStatus('searching')
    try {
      const params = new URLSearchParams({ q, format: 'jsonv2', countrycodes: 'lk', limit: '5' })
      const res = await fetch(`${NOMINATIM_URL}?${params}`, { headers: { 'Accept-Language': 'en' } })
      if (!res.ok) throw new Error(String(res.status))
      const results: Place[] = await res.json()
      setPlaces(results.slice(1))
      setStatus(results.length ? 'idle' : 'none')
      if (results.length) goTo(results[0])
    } catch {
      setPlaces([])
      setStatus('error')
    }
  }

  return (
    <form
      ref={boxRef}
      onSubmit={search}
      role="search"
      className="absolute top-2.5 right-2.5 left-14 z-[1000] md:right-auto md:w-80"
    >
      <div className="flex overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-black/10">
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setStatus('idle')
          }}
          placeholder="Search a town, area or address"
          aria-label="Search places"
          className="min-w-0 flex-1 px-3 py-2 text-sm outline-none"
        />
        <button
          type="submit"
          disabled={status === 'searching'}
          className="bg-gray-900 px-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {status === 'searching' ? '…' : 'Go'}
        </button>
      </div>

      {status === 'none' && <p className="mt-1 rounded-lg bg-white px-3 py-2 text-sm shadow">No places found in Sri Lanka.</p>}
      {status === 'error' && (
        <p className="mt-1 rounded-lg bg-white px-3 py-2 text-sm text-red-600 shadow">Search failed. Try again.</p>
      )}
      {places.length > 0 && (
        <ul className="mt-1 overflow-hidden rounded-xl bg-white text-sm shadow-lg ring-1 ring-black/10">
          <li className="px-3 pt-2 text-xs text-gray-500">Other matches</li>
          {places.map((p) => (
            <li key={p.place_id}>
              <button
                type="button"
                onClick={() => {
                  goTo(p)
                  setPlaces([])
                }}
                className="w-full px-3 py-2 text-left hover:bg-gray-50"
              >
                {p.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </form>
  )
}
