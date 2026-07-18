import { ChannelsManager, PageTitle } from "@/components/admin/admin-ui"
import { requireAdminPage } from "@/lib/admin/auth"
import { getAdminOverview } from "@/lib/admin/data"
export default async function ProblemsPage() { const [admin,data] = await Promise.all([requireAdminPage(),getAdminOverview()]); return <div><PageTitle title="Problem streams" description="Investigate failed checks, retry validation, or replace unreliable stream URLs."/><ChannelsManager initialChannels={data.channels} role={admin.role} problemOnly/></div> }
