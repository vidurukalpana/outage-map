import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Popup } from 'react-leaflet'
import { meToo, resolveReport } from '../api/client'
import type { Cluster, ClusterReport } from '../api/types'
import { OUTAGE_TYPES } from '../lib/outageTypes'
import { formatTime, timeAgo } from '../lib/time'

const CLUSTERS_KEY = ['clusters']

function addMeToo(data: Cluster[] | undefined, reportId: string): Cluster[] | undefined {
  return data?.map((c) =>
    c.reports.some((r) => r.id === reportId)
      ? {
          ...c,
          meTooCount: c.meTooCount + 1,
          reports: c.reports.map((r) => (r.id === reportId ? { ...r, meTooCount: r.meTooCount + 1 } : r)),
        }
      : c,
  )
}

function ReportItem({ report }: { report: ClusterReport }) {
  const queryClient = useQueryClient()
  const refetch = () => queryClient.invalidateQueries({ queryKey: CLUSTERS_KEY })

  const meTooMutation = useMutation({
    mutationFn: () => meToo(report.id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: CLUSTERS_KEY })
      const previous = queryClient.getQueriesData<Cluster[]>({ queryKey: CLUSTERS_KEY })
      queryClient.setQueriesData<Cluster[]>({ queryKey: CLUSTERS_KEY }, (data) => addMeToo(data, report.id))
      return previous
    },
    onError: (_error, _vars, previous) => {
      previous?.forEach(([key, data]) => queryClient.setQueryData(key, data))
    },
    onSettled: refetch,
  })

  const resolveMutation = useMutation({
    mutationFn: () => resolveReport(report.id),
    onSettled: refetch,
  })

  const error = meTooMutation.error ?? resolveMutation.error
  const busy = meTooMutation.isPending || resolveMutation.isPending

  return (
    <li className="space-y-1 py-2">
      <p className={`m-0! ${report.note ? '' : 'text-gray-400 italic'}`}>{report.note ?? 'No note'}</p>
      <p className="m-0! text-xs text-gray-500">
        {formatTime(report.createdAt)} · {report.meTooCount} me too
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => meTooMutation.mutate()}
          className="rounded-lg bg-gray-900 px-3 py-1 text-xs font-semibold text-white disabled:opacity-40"
        >
          Me too
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => window.confirm('Mark as resolved?') && resolveMutation.mutate()}
          className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 disabled:opacity-40"
        >
          Resolved
        </button>
      </div>
      {error && <p className="m-0! text-xs text-red-600">{error.message}</p>}
    </li>
  )
}

export default function ClusterPopup({ cluster }: { cluster: Cluster }) {
  const info = OUTAGE_TYPES.find((t) => t.type === cluster.type)!

  return (
    <Popup>
      <div className="w-60 space-y-2">
        <h3 className="text-base font-semibold" style={{ color: info.color }}>
          {info.icon} {info.label}
        </h3>
        <p className="m-0! text-gray-700">
          {cluster.reportCount} {cluster.reportCount === 1 ? 'report' : 'reports'} · {cluster.meTooCount} me too
        </p>
        <p className="m-0! text-xs text-gray-500">Last activity {timeAgo(cluster.lastActivityAt)}</p>

        <ul className="max-h-60 divide-y divide-gray-100 overflow-y-auto">
          {cluster.reports.map((r) => (
            <ReportItem key={r.id} report={r} />
          ))}
        </ul>
      </div>
    </Popup>
  )
}
