import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import type { OutageType } from '../api/types'
import OutageMap, { type LatLng } from '../components/OutageMap'
import ReportForm from '../components/ReportForm'
import TypeFilter from '../components/TypeFilter'
import { OUTAGE_TYPES } from '../lib/outageTypes'

export default function LivePage() {
  const queryClient = useQueryClient()
  const [types, setTypes] = useState<OutageType[]>(OUTAGE_TYPES.map((t) => t.type))
  const [pin, setPin] = useState<LatLng | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => setMessage(null), 3000)
    return () => clearTimeout(timer)
  }, [message])

  return (
    <main className="flex h-full flex-col">
      <TypeFilter selected={types} onChange={setTypes} />

      <div className="flex-1">
        <OutageMap types={types} pin={pin} onMapClick={setPin} />
      </div>

      {pin && (
        <ReportForm
          key={`${pin.lat},${pin.lng}`}
          lat={pin.lat}
          lng={pin.lng}
          onClose={() => setPin(null)}
          onSent={() => {
            setPin(null)
            setMessage('Report sent')
            queryClient.invalidateQueries({ queryKey: ['clusters'] })
          }}
        />
      )}

      {message && (
        <p
          role="status"
          className="fixed top-24 left-1/2 z-[1000] -translate-x-1/2 rounded-full bg-gray-900 px-4 py-2 text-white shadow-lg"
        >
          {message}
        </p>
      )}
    </main>
  )
}
