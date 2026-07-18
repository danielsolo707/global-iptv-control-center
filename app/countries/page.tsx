import { Suspense } from "react"
import Link from "next/link"
import { CountryCard } from "@/components/cards"
import { EmptyState } from "@/components/ui/primitives"
import { getCountries } from "@/lib/api-client"
import { MapPin, Globe } from "lucide-react"

export default async function CountriesPage() {
  const countries = await getCountries()
  const regions = Array.from(new Set(countries.map((c) => c.region)))

  return (
    <div className="mx-auto max-w-[1600px] space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Countries</h1>
        <p className="text-muted-foreground">
          Browse live TV channels from {countries.length} countries around the world
        </p>
      </div>

      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-card/50" />}>
        {countries.length === 0 ? (
          <EmptyState
            icon={<Globe className="size-8" />}
            title="No countries found"
            description="We couldn't load the country list. Please try again later."
          />
        ) : (
          <>
            {regions.map((region) => {
              const regionCountries = countries.filter((c) => c.region === region)
              return (
                <section key={region} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="size-5 text-blue" />
                    <h2 className="text-xl font-bold">{region}</h2>
                    <span className="text-sm text-muted-foreground">({regionCountries.length} countries)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {regionCountries.map((country) => (
                      <CountryCard key={country.slug} country={country} />
                    ))}
                  </div>
                </section>
              )
            })}
          </>
        )}
      </Suspense>
    </div>
  )
}
