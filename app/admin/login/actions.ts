"use server"

import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim()
  const password = String(formData.get("password") || "")
  const supabase = await createSupabaseServerClient()
  if (!supabase) redirect("/admin/login?error=configuration")

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data.user) redirect("/admin/login?error=credentials")
  const { data: admin } = await supabase.from("admin_users").select("id").eq("user_id", data.user.id).maybeSingle()
  if (!admin) {
    await supabase.auth.signOut()
    redirect("/admin/login?error=unauthorized")
  }
  await supabase.from("admin_users").update({ last_login: new Date().toISOString() }).eq("user_id", data.user.id)
  redirect("/admin")
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient()
  await supabase?.auth.signOut()
  redirect("/admin/login")
}
