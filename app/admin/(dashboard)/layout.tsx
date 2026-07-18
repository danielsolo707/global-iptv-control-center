import { AdminShell } from "@/components/admin/admin-shell"
import { requireAdminPage } from "@/lib/admin/auth"

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdminPage()
  return <AdminShell admin={admin}>{children}</AdminShell>
}
