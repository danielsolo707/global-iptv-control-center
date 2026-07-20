import { Database, RefreshCw, Timer, Trash2 } from "lucide-react"
import { ActionButton, MetricCard, PageTitle, Panel } from "@/components/admin/admin-ui"
import { requireAdminPage } from "@/lib/admin/auth"
import { getAdminOverview, getRecentSyncRuns } from "@/lib/admin/data"

export default async function AdminSyncPage() {
  const [admin, data, runs] = await Promise.all([
    requireAdminPage(),
    getAdminOverview(),
    getRecentSyncRuns(8),
  ])
  const canRun = admin.role === "admin"
  const latest = runs[0]

  return (
    <div>
      <PageTitle
        title="Synchronization"
        description="Import provider changes, refresh metadata, and review sync activity."
        actions={
          <>
            <ActionButton action="start-sync" disabled={!canRun} className="bg-gradient-brand text-white">
              <RefreshCw className="size-4" />
              Start Sync Now
            </ActionButton>
            <ActionButton action="force-sync" disabled={!canRun}>
              <Database className="size-4" />
              Force Full Sync
            </ActionButton>
            <ActionButton action="clear-cache" disabled={!canRun}>
              <Trash2 className="size-4" />
              Clear Cache
            </ActionButton>
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Last synchronization"
          value={latest ? new Date(latest.created_at).toLocaleDateString() : "Never"}
          detail={latest ? new Date(latest.created_at).toLocaleString() : new Date(data.lastSync).toLocaleString()}
          icon={<RefreshCw className="size-5" />}
        />
        <MetricCard
          label="Duration"
          value={latest?.duration_ms != null ? `${Math.round(latest.duration_ms / 1000)}s` : "—"}
          tone="purple"
          icon={<Timer className="size-5" />}
        />
        <MetricCard
          label="Imported"
          value={(latest?.imported_channels ?? 0).toLocaleString()}
          tone="green"
          icon={<Database className="size-5" />}
        />
        <MetricCard
          label="Updated"
          value={(latest?.updated_channels ?? 0).toLocaleString()}
          tone="blue"
          icon={<Database className="size-5" />}
        />
      </div>
      <Panel className="mt-5" title="Synchronization logs" description="Recent catalog sync runs recorded by workers and the admin control center.">
        <div className="space-y-3">
          {runs.map((run) => (
            <div key={run.id} className="grid gap-2 rounded-xl bg-secondary/35 p-4 text-sm sm:grid-cols-5">
              <span className="font-medium">{new Date(run.created_at).toLocaleString()}</span>
              <span>
                <b className="text-emerald-500">{run.imported_channels ?? 0}</b> imported
              </span>
              <span>
                <b className="text-blue">{run.updated_channels ?? 0}</b> updated
              </span>
              <span>
                <b className="text-red-400">{run.removed_channels ?? 0}</b> removed
              </span>
              <span className="text-muted-foreground">
                {run.status}
                {run.duration_ms != null ? ` · ${Math.round(run.duration_ms / 1000)}s` : ""}
                {run.type ? ` · ${run.type}` : ""}
              </span>
            </div>
          ))}
          {runs.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No synchronization runs recorded yet. Start a sync or wait for the daily GitHub Actions job.
            </p>
          )}
        </div>
      </Panel>
    </div>
  )
}
