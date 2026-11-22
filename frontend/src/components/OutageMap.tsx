import { CircleMarker, MapContainer, useMapEvents } from 'react-leaflet'
import type { OutageType } from '../api/types'
import { SRI_LANKA_CENTER } from '../lib/sriLanka'
import ClusterLayer from './ClusterLayer'
import MapSearch from './MapSearch'
import OsmTileLayer from './OsmTileLayer'

export interface LatLng {
  lat: number
  lng: number
}

interface Props {
  types: OutageType[]
  pin: LatLng | null
  onMapClick: (point: LatLng) => void
}

function ClickHandler({ onMapClick }: Pick<Props, 'onMapClick'>) {
  useMapEvents({ click: (e) => onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng }) })
  return null
}

export default function OutageMap({ types, pin, onMapClick }: Props) {
  return (
    <MapContainer center={SRI_LANKA_CENTER} zoom={8} className="h-full w-full">
      <OsmTileLayer />
      <MapSearch />
      <ClickHandler onMapClick={onMapClick} />
      <ClusterLayer types={types} />
      {pin && (
        <CircleMarker
          center={[pin.lat, pin.lng]}
          radius={9}
          pathOptions={{ color: '#111827', fillColor: '#ffffff', fillOpacity: 1, weight: 3 }}
        />
      )}
    </MapContainer>
  )
}
