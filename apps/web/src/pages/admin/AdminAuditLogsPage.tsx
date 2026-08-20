import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Eye,
  X,
  Copy,
  Check,
  Activity,
  Layers,
  Database,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { auditLogsApi, type AuditLogDto } from '@/lib/api/audit-logs-api'

export function AdminAuditLogsPage() {
  const [search, setSearch] = useState('')
  const [selectedAction, setSelectedAction] = useState('')
  const [selectedEntityType, setSelectedEntityType] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 15

  const [inspectLog, setInspectLog] = useState<AuditLogDto | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // Query metadata for filter dropdowns
  const { data: metadata } = useQuery({
    queryKey: ['audit-logs-metadata'],
    queryFn: () => auditLogsApi.getMetadata()
  })

  // Query audit logs with pagination and filters
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['audit-logs', page, pageSize, selectedAction, selectedEntityType, search],
    queryFn: () =>
      auditLogsApi.getAuditLogs({
        page,
        pageSize,
        action: selectedAction || undefined,
        entityType: selectedEntityType || undefined,
        search: search || undefined
      })
  })

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const getActionBadge = (action: string) => {
    switch (action.toUpperCase()) {
      case 'CREATE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'UPDATE':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'SOFT_DELETE':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      case 'HARD_DELETE':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20'
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    }
  }

  const parseJson = (jsonString?: string) => {
    if (!jsonString) return null
    try {
      return JSON.parse(jsonString)
    } catch {
      return jsonString
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <ShieldAlert className="h-7 w-7 text-amber-400" />
            Security & Audit Trail
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Enterprise immutable record of all data modifications, administrative events, and security access.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 transition shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin text-amber-400' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Audit Events</p>
            <h3 className="text-2xl font-bold text-white mt-1">{data?.totalCount ?? '—'}</h3>
          </div>
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
            <Layers className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Logged Entities</p>
            <h3 className="text-2xl font-bold text-white mt-1">{metadata?.entityTypes?.length ?? '—'}</h3>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
            <Database className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Current Page Events</p>
            <h3 className="text-2xl font-bold text-white mt-1">{data?.items?.length ?? 0}</h3>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <Activity className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Security Policy</p>
            <h3 className="text-sm font-bold text-emerald-400 mt-1">Full Change Capture</h3>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
            <ShieldAlert className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by action, entity, user, IP, or correlation ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full pl-10 pr-4 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Action Filter */}
          <select
            value={selectedAction}
            onChange={(e) => {
              setSelectedAction(e.target.value)
              setPage(1)
            }}
            className="bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-400 transition"
          >
            <option value="">All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="SOFT_DELETE">SOFT_DELETE</option>
            <option value="HARD_DELETE">HARD_DELETE</option>
          </select>

          {/* Entity Type Filter */}
          <select
            value={selectedEntityType}
            onChange={(e) => {
              setSelectedEntityType(e.target.value)
              setPage(1)
            }}
            className="bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-400 transition"
          >
            <option value="">All Entities</option>
            {metadata?.entityTypes?.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {(search || selectedAction || selectedEntityType) && (
            <button
              onClick={() => {
                setSearch('')
                setSelectedAction('')
                setSelectedEntityType('')
                setPage(1)
              }}
              className="px-3 py-2 text-xs text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl transition"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Entity</th>
                <th className="py-3.5 px-4">Actor / Role</th>
                <th className="py-3.5 px-4">IP Address</th>
                <th className="py-3.5 px-4">Trace ID</th>
                <th className="py-3.5 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-amber-400 mb-2" />
                    Loading audit trail events...
                  </td>
                </tr>
              ) : data?.items?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Filter className="h-8 w-8 mx-auto text-slate-600 mb-2" />
                    No audit records match the current filters.
                  </td>
                </tr>
              ) : (
                data?.items?.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{log.entityType}</span>
                        <span className="text-[10px] font-mono text-slate-500" title={log.entityId}>
                          ({log.entityId.substring(0, 8)}...)
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-white font-medium">
                          {log.userName || log.userEmail || (log.userId ? log.userId.substring(0, 8) + '...' : 'System')}
                        </span>
                        {log.role && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {log.role}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {log.correlationId ? `${log.correlationId.substring(0, 8)}...` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setInspectLog(log)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-medium transition"
                      >
                        <Eye className="h-3 w-3" /> Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {data && data.totalPages > 1 && (
          <div className="p-4 bg-slate-950/50 border-t border-slate-800 flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Showing page <span className="text-white font-semibold">{data.page}</span> of{' '}
              <span className="text-white font-semibold">{data.totalPages}</span> ({data.totalCount} total events)
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!data.hasPreviousPage}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={!data.hasNextPage}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* JSON Diff / Inspect Modal */}
      {inspectLog && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getActionBadge(inspectLog.action)}`}>
                    {inspectLog.action}
                  </span>
                  <h2 className="text-lg font-bold text-white">
                    {inspectLog.entityType} ({inspectLog.entityId})
                  </h2>
                </div>
                <p className="text-xs text-slate-400 font-mono">
                  Event ID: {inspectLog.id} • {new Date(inspectLog.createdAt).toISOString()}
                </p>
              </div>

              <button
                onClick={() => setInspectLog(null)}
                className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Context Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Actor & Role</p>
                  <p className="text-xs text-white font-medium mt-1">
                    {inspectLog.userName || inspectLog.userEmail || 'System Actor'}
                  </p>
                  <p className="text-[10px] text-amber-400 font-mono mt-0.5">{inspectLog.role || 'N/A'}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Network IP</p>
                  <p className="text-xs text-white font-mono mt-1">{inspectLog.ipAddress || '127.0.0.1'}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Correlation ID</p>
                    <p className="text-xs text-slate-300 font-mono mt-1">
                      {inspectLog.correlationId ? `${inspectLog.correlationId.substring(0, 12)}...` : 'None'}
                    </p>
                  </div>
                  {inspectLog.correlationId && (
                    <button
                      onClick={() => copyToClipboard(inspectLog.correlationId!, 'correlationId')}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      title="Copy full correlation ID"
                    >
                      {copiedField === 'correlationId' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  )}
                </div>
              </div>

              {/* State Changes Diff Section */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Database className="h-4 w-4 text-blue-400" /> Entity Property State Diffs
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Before / Old Values */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-rose-500" /> Previous Values (Before)
                      </span>
                      {inspectLog.oldValuesJson && (
                        <button
                          onClick={() => copyToClipboard(inspectLog.oldValuesJson!, 'oldValues')}
                          className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
                        >
                          {copiedField === 'oldValues' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />} Copy JSON
                        </button>
                      )}
                    </div>
                    <pre className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-72">
                      {inspectLog.oldValuesJson
                        ? JSON.stringify(parseJson(inspectLog.oldValuesJson), null, 2)
                        : '// No prior state (Entity created)'}
                    </pre>
                  </div>

                  {/* After / New Values */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" /> Current Values (After)
                      </span>
                      {inspectLog.newValuesJson && (
                        <button
                          onClick={() => copyToClipboard(inspectLog.newValuesJson!, 'newValues')}
                          className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
                        >
                          {copiedField === 'newValues' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />} Copy JSON
                        </button>
                      )}
                    </div>
                    <pre className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-72">
                      {inspectLog.newValuesJson
                        ? JSON.stringify(parseJson(inspectLog.newValuesJson), null, 2)
                        : '// No resulting state (Entity deleted)'}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setInspectLog(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
