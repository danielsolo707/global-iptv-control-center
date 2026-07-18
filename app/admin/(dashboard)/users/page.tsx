import { ShieldCheck, UserCog } from "lucide-react"
import { requireAdminPage } from "@/lib/admin/auth"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ActionButton, MetricCard, PageTitle, Panel } from "@/components/admin/admin-ui"
import { AdminInvite } from "@/components/admin/admin-invite"

export default async function AdminUsersPage() {
  await requireAdminPage("admin")
  const supabase = await createSupabaseServerClient()
  const { data } = supabase
    ? await supabase.from("admin_users").select("id,email,role,created_at,last_login").order("created_at", { ascending: false })
    : { data: null }
  const users = data || []
  return <div>
    <PageTitle title="Admin users" description="Role-based access for administrators, moderators, and read-only viewers." actions={<AdminInvite />} />
    <div className="mb-5 grid gap-4 sm:grid-cols-3"><MetricCard label="Administrators" value={users.filter((user) => user.role === "admin").length} icon={<ShieldCheck className="size-5" />} /><MetricCard label="Moderators" value={users.filter((user) => user.role === "moderator").length} tone="purple" icon={<UserCog className="size-5" />} /><MetricCard label="Viewers" value={users.filter((user) => user.role === "viewer").length} tone="green" icon={<UserCog className="size-5" />} /></div>
    <Panel title="Authorized accounts"><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="text-xs text-muted-foreground"><tr><th className="pb-3">Email</th><th className="pb-3">Role</th><th className="pb-3">Created</th><th className="pb-3">Last login</th><th /></tr></thead><tbody>{users.map((user) => <tr key={user.id} className="border-t border-border/50"><td className="py-4 font-medium">{user.email}</td><td className="py-4 capitalize">{user.role}</td><td className="py-4 text-muted-foreground">{new Date(user.created_at).toLocaleDateString()}</td><td className="py-4 text-muted-foreground">{user.last_login ? new Date(user.last_login).toLocaleString() : "Never"}</td><td className="py-4 text-right"><ActionButton action="remove-admin" payload={{ id: user.id }}>Remove</ActionButton></td></tr>)}{users.length === 0 && <tr><td colSpan={5} className="py-10 text-center text-muted-foreground">Apply the Supabase migration and add the first admin user.</td></tr>}</tbody></table></div></Panel>
  </div>
}
