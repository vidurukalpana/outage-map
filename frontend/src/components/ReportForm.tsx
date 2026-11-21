import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { createReport } from '../api/client'
import type { OutageType } from '../api/types'
import { OUTAGE_TYPES } from '../lib/outageTypes'

const MAX_NOTE = 140

interface Props {
  lat: number
  lng: number
  onClose: () => void
  onSent: () => void
}

export default function ReportForm({ lat, lng, onClose, onSent }: Props) {
  const [type, setType] = useState<OutageType | null>(null)
  const [note, setNote] = useState('')

  const mutation = useMutation({ mutationFn: createReport, onSuccess: onSent })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!type) return
    const trimmed = note.trim()
    mutation.mutate({ type, lat, lng, ...(trimmed && { note: trimmed }) })
  }

  return (
    <form
      onSubmit={submit}
      className="fixed inset-x-0 bottom-0 z-[1000] mx-auto max-w-md space-y-4 rounded-t-2xl bg-white p-4 shadow-2xl"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Report an outage</h2>
        <button type="button" onClick={onClose} aria-label="Close" className="px-2 text-2xl text-gray-500">
          ×
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {OUTAGE_TYPES.map((t) => {
          const selected = type === t.type
          return (
            <button
              key={t.type}
              type="button"
              onClick={() => setType(t.type)}
              aria-pressed={selected}
              className="flex flex-col items-center gap-1 rounded-xl border-2 py-3 font-medium"
              style={{
                borderColor: t.color,
                backgroundColor: selected ? t.color : 'white',
                color: selected ? 'white' : t.color,
              }}
            >
              <span className="text-2xl" aria-hidden="true">
                {t.icon}
              </span>
              {t.label}
            </button>
          )
        })}
      </div>

      <div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={MAX_NOTE}
          rows={2}
          placeholder="Optional note"
          className="w-full resize-none rounded-lg border border-gray-300 p-2"
        />
        <p className="text-right text-sm text-gray-500">
          {note.length}/{MAX_NOTE}
        </p>
      </div>

      {mutation.isError && <p className="text-sm text-red-600">{mutation.error.message}</p>}

      <button
        type="submit"
        disabled={!type || mutation.isPending}
        className="w-full rounded-xl bg-gray-900 py-3 font-semibold text-white disabled:opacity-40"
      >
        {mutation.isPending ? 'Sending…' : 'Report'}
      </button>
    </form>
  )
}
