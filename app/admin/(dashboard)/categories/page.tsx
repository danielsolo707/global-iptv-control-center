import { Plus, Tags } from "lucide-react"
import { requireAdminPage } from "@/lib/admin/auth"
import { getManagedCategories } from "@/lib/admin/data"
import { MetricCard, PageTitle, Panel, ToggleRow } from "@/components/admin/admin-ui"

export default async function AdminCategoriesPage() {
  const [admin, categories] = await Promise.all([requireAdminPage(), getManagedCategories()])
  const totalChannels = categories.reduce((sum, item) => sum + item.channels, 0)

  return (
    <div>
      <PageTitle
        title="Category management"
        description="Control which content categories are visible in the public catalog."
        actions={
          <button
            disabled={admin.role === "viewer"}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-gradient-brand px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Plus className="size-4" />
            Create category
          </button>
        }
      />
      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        <MetricCard label="Categories" value={categories.length} icon={<Tags className="size-5" />} />
        <MetricCard label="Categorized channels" value={totalChannels.toLocaleString()} tone="purple" icon={<Tags className="size-5" />} />
      </div>
      <Panel title="Platform categories">
        <div className="grid gap-x-8 lg:grid-cols-2">
          {categories.map((category) => (
            <ToggleRow
              key={category.id}
              id={category.id}
              label={category.name}
              detail={`${category.channels.toLocaleString()} channels`}
              checked={category.enabled}
              role={admin.role}
              kind="category"
            />
          ))}
          {categories.length === 0 && (
            <p className="py-8 text-sm text-muted-foreground">No categories yet. Run a catalog sync to populate channels.</p>
          )}
        </div>
      </Panel>
    </div>
  )
}
