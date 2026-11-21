import { Popup } from 'react-leaflet'
import type { Cluster } from '../api/types'
import { OUTAGE_TYPES } from '../lib/outageTypes'
import { formatTime, timeAgo } from '../lib/time'

export default function ClusterPopup({ cluster }: { cluster: Cluster }) {
  const info = OUTAGE_TYPES.find((t) => t.type === cluster.type)!

  return (
    <Popup>
      <div className="w-56 space-y-2">
        <h3 className="text-base font-semibold" style={{ color: info.color }}>
          {info.icon} {info.label}
        </h3>
        <p className="m-0! text-gray-700">
          {cluster.reportCount} {cluster.reportCount === 1 ? 'report' : 'reports'} · {cluster.meTooCount} me too
        </p>
        <p className="m-0! text-xs text-gray-500">Last activity {timeAgo(cluster.lastActivityAt)}</p>

        <ul className="max-h-48 divide-y divide-gray-100 overflow-y-auto">
          {cluster.reports.map((r) => (
            <li key={r.id} className="py-1.5">
              <p className={`m-0! ${r.note ? '' : 'text-gray-400 italic'}`}>{r.note ?? 'No note'}</p>
              <p className="m-0! text-xs text-gray-500">{formatTime(r.createdAt)}</p>
            </li>
          ))}
        </ul>
      </div>
    </Popup>
  )
}
