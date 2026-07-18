import { CategoryCard } from "@/components/cards"
import { EmptyState } from "@/components/ui/primitives"
import { getCategories } from "@/lib/api-client"
import { LayoutGrid } from "lucide-react"

export default async function CategoriesPage() {
  const categories = await getCategories()

  return (
    <div className="mx-auto max-w-[1600px] space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
        <p className="text-muted-foreground">
          Browse channels by category — from news and sports to movies and music
        </p>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          icon={<LayoutGrid className="size-8" />}
          title="No categories found"
          description="We couldn't load the category list. Please try again later."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category) => (
            <CategoryCard key={category.slug} category={category} wide />
          ))}
        </div>
      )}
    </div>
  )
}
