import { Plus } from "lucide-react"
import { ChannelsManager, PageTitle } from "@/components/admin/admin-ui"
import { requireAdminPage } from "@/lib/admin/auth"
import { getAdminOverview } from "@/lib/admin/data"

export default async function AdminChannelsPage() { const [admin, data] = await Promise.all([requireAdminPage(), getAdminOverview()]); return <div><PageTitle title="Channel management" description={`Manage ${data.totals.channels.toLocaleString()} provider streams, metadata, and health state.`} actions={<button disabled={admin.role === "viewer"} className="inline-flex h-10 items-center gap-2 rounded-lg bg-gradient-brand px-4 text-sm font-semibold text-white disabled:opacity-50"><Plus className="size-4"/>Add channel</button>}/><ChannelsManager initialChannels={data.channels} role={admin.role}/></div> }
