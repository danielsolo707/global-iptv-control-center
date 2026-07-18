"use client"

import { useApp } from "@/components/app-provider"
import { SectionHeader } from "@/components/ui/primitives"
import { cn } from "@/lib/utils"
import {
  Settings,
  Monitor,
  Play,
  Accessibility,
  Zap,
  Trash2,
} from "lucide-react"

export default function SettingsPage() {
  const { settings, updateSettings, clearRecent } = useApp()

  const Toggle = ({
    checked,
    onChange,
  }: {
    checked: boolean
    onChange: (v: boolean) => void
  }) => (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-7 w-12 rounded-full transition-colors",
        checked ? "bg-gradient-brand" : "bg-muted",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 size-6 rounded-full bg-white shadow transition-transform",
          checked ? "left-[26px]" : "left-0.5",
        )}
      />
    </button>
  )

  return (
    <div className="mx-auto max-w-[1600px] space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Customize your viewing experience</p>
      </div>

      <div className="space-y-4">
        {/* Video Quality */}
        <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/50 p-5">
          <div className="flex items-center gap-4">
            <span className="grid size-10 place-items-center rounded-xl bg-blue/10">
              <Monitor className="size-5 text-blue" />
            </span>
            <div>
              <p className="font-semibold">Video Quality</p>
              <p className="text-sm text-muted-foreground">Default stream quality</p>
            </div>
          </div>
          <select
            value={settings.quality}
            onChange={(e) => updateSettings({ quality: e.target.value as typeof settings.quality })}
            className="rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none"
          >
            <option value="Auto">Auto</option>
            <option value="HD">HD</option>
            <option value="4K">4K</option>
          </select>
        </div>

        {/* Autoplay */}
        <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/50 p-5">
          <div className="flex items-center gap-4">
            <span className="grid size-10 place-items-center rounded-xl bg-purple/10">
              <Play className="size-5 text-purple" />
            </span>
            <div>
              <p className="font-semibold">Autoplay</p>
              <p className="text-sm text-muted-foreground">Start playing automatically</p>
            </div>
          </div>
          <Toggle
            checked={settings.autoplay}
            onChange={(v) => updateSettings({ autoplay: v })}
          />
        </div>

        {/* Reduce Motion */}
        <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/50 p-5">
          <div className="flex items-center gap-4">
            <span className="grid size-10 place-items-center rounded-xl bg-emerald-500/10">
              <Accessibility className="size-5 text-emerald-400" />
            </span>
            <div>
              <p className="font-semibold">Reduce Motion</p>
              <p className="text-sm text-muted-foreground">Minimize animations</p>
            </div>
          </div>
          <Toggle
            checked={settings.reduceMotion}
            onChange={(v) => updateSettings({ reduceMotion: v })}
          />
        </div>

        {/* High Contrast */}
        <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/50 p-5">
          <div className="flex items-center gap-4">
            <span className="grid size-10 place-items-center rounded-xl bg-amber-400/10">
              <Accessibility className="size-5 text-amber-400" />
            </span>
            <div>
              <p className="font-semibold">High Contrast</p>
              <p className="text-sm text-muted-foreground">Increase contrast for readability</p>
            </div>
          </div>
          <Toggle
            checked={settings.highContrast}
            onChange={(v) => updateSettings({ highContrast: v })}
          />
        </div>

        {/* Hardware Acceleration */}
        <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/50 p-5">
          <div className="flex items-center gap-4">
            <span className="grid size-10 place-items-center rounded-xl bg-sky-500/10">
              <Zap className="size-5 text-sky-400" />
            </span>
            <div>
              <p className="font-semibold">Hardware Acceleration</p>
              <p className="text-sm text-muted-foreground">Use GPU for video decoding</p>
            </div>
          </div>
          <Toggle
            checked={settings.hardwareAccel}
            onChange={(v) => updateSettings({ hardwareAccel: v })}
          />
        </div>

        {/* Clear Data */}
        <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/50 p-5">
          <div className="flex items-center gap-4">
            <span className="grid size-10 place-items-center rounded-xl bg-red-500/10">
              <Trash2 className="size-5 text-red-400" />
            </span>
            <div>
              <p className="font-semibold">Clear Watch History</p>
              <p className="text-sm text-muted-foreground">Remove all recently watched items</p>
            </div>
          </div>
          <button
            onClick={clearRecent}
            className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  )
}
