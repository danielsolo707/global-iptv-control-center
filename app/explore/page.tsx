import { getCountries } from "@/lib/api-client"
import ExploreClient from "./explore-client"

export default async function ExplorePage() {
  const countries = await getCountries()
  return <ExploreClient countries={countries} />
}
