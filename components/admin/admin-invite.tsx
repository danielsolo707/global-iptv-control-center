"use client"

import { useState } from "react"
import { Loader2, Plus, X } from "lucide-react"

export function AdminInvite() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  return <><button onClick={() => setOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-lg bg-gradient-brand px-4 text-sm font-semibold text-white"><Plus className="size-4" />Invite user</button>{open && <div className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-4"><form onSubmit={async (event) => { event.preventDefault(); setLoading(true); const form = new FormData(event.currentTarget); const response = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(form)) }); const result = await response.json(); setMessage(response.ok ? "Invitation sent" : result.error); setLoading(false) }} className="w-full max-w-md rounded-2xl border border-border bg-popover p-6 shadow-2xl"><div className="mb-5 flex items-center"><div className="flex-1"><h2 className="font-heading text-lg font-bold">Invite an admin user</h2><p className="text-xs text-muted-foreground">Supabase sends a secure account invitation.</p></div><button type="button" onClick={() => setOpen(false)}><X className="size-5" /></button></div><label className="text-sm font-medium">Email<input name="email" type="email" required className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3" /></label><label className="mt-4 block text-sm font-medium">Role<select name="role" className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3"><option value="viewer">Viewer</option><option value="moderator">Moderator</option><option value="admin">Admin</option></select></label>{message && <p className="mt-4 rounded-lg bg-secondary p-3 text-xs">{message}</p>}<button disabled={loading} className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-gradient-brand text-sm font-semibold text-white">{loading && <Loader2 className="size-4 animate-spin" />}Send invitation</button></form></div>}</>
}
