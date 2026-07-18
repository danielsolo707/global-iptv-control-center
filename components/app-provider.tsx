"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"

type Settings = {
  autoplay: boolean
  reduceMotion: boolean
  highContrast: boolean
}

type AppState = {
  favorites: string[]
  favoriteCountries: string[]
  recent: string[]
  settings: Settings
  toggleFavorite: (slug: string) => void
  toggleFavoriteCountry: (slug: string) => void
  isFavorite: (slug: string) => boolean
  isFavoriteCountry: (slug: string) => boolean
  addRecent: (slug: string) => void
  clearRecent: () => void
  updateSettings: (patch: Partial<Settings>) => void
}

const defaultSettings: Settings = {
  autoplay: true,
  reduceMotion: false,
  highContrast: false,
}

const AppContext = createContext<AppState | null>(null)

function useStored<T>(key: string, initial: T): [T, (v: T | ((p: T) => T)) => void] {
  const [value, setValue] = useState<T>(initial)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw) setValue(JSON.parse(raw))
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const set = useCallback(
    (v: T | ((p: T) => T)) => {
      setValue((prev) => {
        const next = typeof v === "function" ? (v as (p: T) => T)(prev) : v
        try {
          localStorage.setItem(key, JSON.stringify(next))
        } catch {}
        return next
      })
    },
    [key],
  )
  return [value, set]
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useStored<string[]>("gi_favorites", [])
  const [favoriteCountries, setFavoriteCountries] = useStored<string[]>("gi_fav_countries", [])
  const [recent, setRecent] = useStored<string[]>("gi_recent", [])
  const [settings, setSettings] = useStored<Settings>("gi_settings", defaultSettings)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle("reduce-motion", settings.reduceMotion)
    root.classList.toggle("high-contrast", settings.highContrast)
  }, [settings.highContrast, settings.reduceMotion])

  const toggleFavorite = useCallback(
    (slug: string) => setFavorites((p) => (p.includes(slug) ? p.filter((s) => s !== slug) : [...p, slug])),
    [setFavorites],
  )
  const toggleFavoriteCountry = useCallback(
    (slug: string) => setFavoriteCountries((p) => (p.includes(slug) ? p.filter((s) => s !== slug) : [...p, slug])),
    [setFavoriteCountries],
  )
  const addRecent = useCallback(
    (slug: string) => setRecent((p) => [slug, ...p.filter((s) => s !== slug)].slice(0, 12)),
    [setRecent],
  )

  const value: AppState = {
    favorites,
    favoriteCountries,
    recent,
    settings,
    toggleFavorite,
    toggleFavoriteCountry,
    isFavorite: (slug) => favorites.includes(slug),
    isFavoriteCountry: (slug) => favoriteCountries.includes(slug),
    addRecent,
    clearRecent: () => setRecent([]),
    updateSettings: (patch) => setSettings((p) => ({ ...p, ...patch })),
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp must be used within AppProvider")
  return ctx
}
