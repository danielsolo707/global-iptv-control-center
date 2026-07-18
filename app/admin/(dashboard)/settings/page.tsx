import { Settings, ShieldCheck } from "lucide-react"
import { requireAdminPage } from "@/lib/admin/auth"
import { MetricCard, PageTitle, Panel } from "@/components/admin/admin-ui"
import { AdminSettingsForm } from "@/components/admin/admin-settings"
export default async function AdminSystemSettingsPage(){await requireAdminPage("admin");return <div><PageTitle title="System settings" description="Configure automation thresholds, platform defaults, and maintenance behavior."/><div className="mb-5 grid gap-4 sm:grid-cols-2"><MetricCard label="Configuration status" value="Active" tone="green" icon={<Settings className="size-5"/>}/><MetricCard label="Access level" value="Admin only" tone="purple" icon={<ShieldCheck className="size-5"/>}/></div><Panel title="Automation and defaults" description="Changes are logged and applied to future worker runs"><AdminSettingsForm/></Panel></div>}
