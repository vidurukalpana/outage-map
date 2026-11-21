import 'leaflet/dist/leaflet.css'
import { CircleMarker, MapContainer, TileLayer, useMapEvents } from 'react-leaflet'

const SRI_LANKA_CENTER: [number, number] = [7.87, 80.77]

export interface LatLng {
  lat: number
  lng: number
}

interface Props {
  pin: LatLng | null
  onMapClick: (point: LatLng) => void
}

function ClickHandler({ onMapClick }: Pick<Props, 'onMapClick'>) {
  useMapEvents({ click: (e) => onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng }) })
  return null
}

export default function OutageMap({ pin, onMapClick }: Props) {
  return (
    <MapContainer center={SRI_LANKA_CENTER} zoom={8} className="h-full w-full">
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        maxZoom={19}
      />
      <ClickHandler onMapClick={onMapClick} />
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
