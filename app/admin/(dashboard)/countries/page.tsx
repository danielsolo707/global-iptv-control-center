import { Globe2 } from "lucide-react"
import { requireAdminPage } from "@/lib/admin/auth"
import { getManagedCountries } from "@/lib/admin/data"
import { MetricCard, PageTitle, Panel, ToggleRow } from "@/components/admin/admin-ui"

export default async function AdminCountriesPage() {
  const [admin, countries] = await Promise.all([requireAdminPage(), getManagedCountries()])
  const enabledCount = countries.filter((country) => country.enabled).length
  const totalChannels = countries.reduce((sum, country) => sum + country.totalChannels, 0)

  return (
    <div>
      <PageTitle
        title="Country management"
        description="Control which countries are visible and included by synchronization workers."
      />
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <MetricCard label="Supported countries" value={countries.length} icon={<Globe2 className="size-5" />} />
        <MetricCard label="Enabled countries" value={enabledCount} tone="green" icon={<Globe2 className="size-5" />} />
        <MetricCard label="Total mapped channels" value={totalChannels.toLocaleString()} tone="purple" icon={<Globe2 className="size-5" />} />
      </div>
      <Panel title="Country visibility" description="Disabled countries are ignored during the next sync and hidden from the public catalog.">
        <div className="grid gap-x-8 lg:grid-cols-2">
          {countries.map((country) => (
            <ToggleRow
              key={country.code}
              id={country.code}
              label={`${country.name} (${country.code})`}
              detail={`${country.totalChannels.toLocaleString()} total · ${country.onlineChannels.toLocaleString()} online`}
              checked={country.enabled}
              role={admin.role}
              kind="country"
            />
          ))}
          {countries.length === 0 && (
            <p className="py-8 text-sm text-muted-foreground">No countries found. Apply the Supabase catalog migration first.</p>
          )}
        </div>
      </Panel>
    </div>
  )
}
