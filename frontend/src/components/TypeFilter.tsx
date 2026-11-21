import type { OutageType } from '../api/types'
import { OUTAGE_TYPES } from '../lib/outageTypes'

interface Props {
  selected: OutageType[]
  onChange: (types: OutageType[]) => void
}

// Each checkbox carries its type colour, so the filter doubles as the map legend.
export default function TypeFilter({ selected, onChange }: Props) {
  function toggle(type: OutageType) {
    onChange(selected.includes(type) ? selected.filter((t) => t !== type) : [...selected, type])
  }

  return (
    <fieldset className="flex flex-wrap gap-x-4 gap-y-1 bg-white px-3 py-2 text-sm shadow">
      <legend className="sr-only">Outage types</legend>
      {OUTAGE_TYPES.map((t) => (
        <label key={t.type} className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={selected.includes(t.type)}
            onChange={() => toggle(t.type)}
            style={{ accentColor: t.color }}
          />
          <span className="inline-block size-3 rounded-full" style={{ backgroundColor: t.color }} />
          {t.label}
        </label>
      ))}
    </fieldset>
  )
}
