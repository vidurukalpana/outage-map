import 'leaflet/dist/leaflet.css'
import { TileLayer } from 'react-leaflet'

export default function OsmTileLayer() {
  return (
    <TileLayer
      url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      maxZoom={19}
    />
  )
}
