import type { OutageType } from '../api/types'
import { OUTAGE_TYPES } from '../lib/outageTypes'

interface Props {
  selected: OutageType[]
  onChange: (types: OutageType[]) => void
}

// Each chip carries its type colour, so the filter doubles as the map legend.
export default function TypeFilter({ selected, onChange }: Props) {
  function toggle(type: OutageType) {
    onChange(selected.includes(type) ? selected.filter((t) => t !== type) : [...selected, type])
  }

  return (
    <div className="space-y-1.5 border-b border-gray-200 bg-white px-3 py-2">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Show outage types">
        {OUTAGE_TYPES.map((t) => {
          const on = selected.includes(t.type)
          return (
            <button
              key={t.type}
              type="button"
              onClick={() => toggle(t.type)}
              aria-pressed={on}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition ${
                on ? '' : 'border-gray-200 bg-gray-50 text-gray-400'
              }`}
              style={on ? { color: t.color, borderColor: t.color, backgroundColor: `${t.color}14` } : undefined}
            >
              <span className={on ? '' : 'opacity-40 grayscale'} aria-hidden="true">
                {t.icon}
              </span>
              {t.label}
            </button>
          )
        })}
      </div>
      <p className="text-xs text-gray-500">
        Tap a type to show or hide it. Tap anywhere on the map to report a problem; tap a circle to see reports or
        add "me too".
      </p>
    </div>
  )
}
