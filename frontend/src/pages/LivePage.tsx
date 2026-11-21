import { useEffect, useState } from 'react'
import OutageMap, { type LatLng } from '../components/OutageMap'
import ReportForm from '../components/ReportForm'

export default function LivePage() {
  const [pin, setPin] = useState<LatLng | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => setMessage(null), 3000)
    return () => clearTimeout(timer)
  }, [message])

  return (
    <main className="h-dvh">
      <OutageMap pin={pin} onMapClick={setPin} />

      {pin && (
        <ReportForm
          key={`${pin.lat},${pin.lng}`}
          lat={pin.lat}
          lng={pin.lng}
          onClose={() => setPin(null)}
          onSent={() => {
            setPin(null)
            setMessage('Report sent')
          }}
        />
      )}

      {message && (
        <p
          role="status"
          className="fixed top-4 left-1/2 z-[1000] -translate-x-1/2 rounded-full bg-gray-900 px-4 py-2 text-white shadow-lg"
        >
          {message}
        </p>
      )}
    </main>
  )
}
