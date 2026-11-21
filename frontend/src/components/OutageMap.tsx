import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer } from 'react-leaflet'

const SRI_LANKA_CENTER: [number, number] = [7.87, 80.77]

export default function OutageMap() {
  return (
    <MapContainer center={SRI_LANKA_CENTER} zoom={8} className="h-full w-full">
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        maxZoom={19}
      />
    </MapContainer>
  )
}
