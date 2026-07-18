"use client"

import { useState } from "react"
import { Save, Loader2 } from "lucide-react"

export function AdminSettingsForm() {
  const [saving,setSaving]=useState(false); const [saved,setSaved]=useState(false)
  return <form onSubmit={async(event)=>{event.preventDefault();setSaving(true);const form=new FormData(event.currentTarget);await fetch("/api/admin/action",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"save-settings",settings:Object.fromEntries(form)})});setSaving(false);setSaved(true);setTimeout(()=>setSaved(false),2500)}} className="space-y-6">
    <div className="grid gap-5 md:grid-cols-2"><label className="text-sm font-medium">Stream check interval<select name="stream_check_interval" defaultValue="60" className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3"><option value="30">30 minutes</option><option value="60">1 hour</option><option value="360">6 hours</option><option value="720">12 hours</option><option value="1440">24 hours</option></select></label><label className="text-sm font-medium">Default country visibility<select name="default_country_visibility" defaultValue="enabled" className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3"><option value="enabled">Enabled</option><option value="disabled">Disabled</option></select></label><label className="text-sm font-medium">Offline after failures<input name="offline_threshold" type="number" min="1" defaultValue="3" className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3"/></label><label className="text-sm font-medium">Block after failures<input name="blocked_threshold" type="number" min="2" defaultValue="10" className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3"/></label></div>
    <label className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 p-4"><span><b className="block text-sm">Maintenance mode</b><span className="text-xs text-muted-foreground">Temporarily suspend public viewing while administrators retain access.</span></span><input name="maintenance_mode" type="checkbox" value="true" className="size-5 accent-blue"/></label>
    <button className="inline-flex h-10 items-center gap-2 rounded-lg bg-gradient-brand px-4 text-sm font-semibold text-white">{saving?<Loader2 className="size-4 animate-spin"/>:<Save className="size-4"/>}{saved?"Saved":"Save settings"}</button>
  </form>
}
