import Link from "next/link"
import { ShieldCheck, LockKeyhole, ArrowLeft, Tv2 } from "lucide-react"
import { loginAction } from "./actions"
import { isSupabaseConfigured } from "@/lib/supabase/server"

const messages: Record<string, string> = {
  configuration: "Supabase is not configured. Add the values from .env.example before signing in.",
  credentials: "The email or password is incorrect.",
  unauthorized: "This account is not registered as an administrator.",
}

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  const configured = isSupabaseConfigured()
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#060810] px-4 py-10 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(68,98,255,.2),transparent_35%),radial-gradient(circle_at_85%_85%,rgba(161,74,255,.16),transparent_32%)]" />
      <div className="relative w-full max-w-md">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-white/55 transition hover:text-white"><ArrowLeft className="size-4" /> Back to Global IPTV</Link>
        <section className="rounded-3xl border border-white/10 bg-white/[.055] p-7 shadow-2xl backdrop-blur-2xl sm:p-9">
          <div className="mb-8 flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-2xl bg-gradient-brand shadow-lg"><Tv2 className="size-6" /></span>
            <div><p className="font-heading text-xl font-extrabold">Control Center</p><p className="text-xs text-white/45">Global IPTV Administration</p></div>
          </div>
          <div className="mb-7"><div className="mb-4 grid size-11 place-items-center rounded-xl bg-blue/10 text-blue"><ShieldCheck className="size-5" /></div><h1 className="font-heading text-2xl font-bold">Administrator sign in</h1><p className="mt-2 text-sm leading-6 text-white/55">Use an account assigned to the admin, moderator, or viewer role.</p></div>
          {error && messages[error] && <div role="alert" className="mb-5 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{messages[error]}</div>}
          <form action={loginAction} className="space-y-4">
            <label className="block text-sm font-medium">Email<input name="email" type="email" required autoComplete="email" className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 outline-none transition focus:border-blue" placeholder="admin@example.com" /></label>
            <label className="block text-sm font-medium">Password<input name="password" type="password" required autoComplete="current-password" className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 outline-none transition focus:border-blue" placeholder="••••••••" /></label>
            <button disabled={!configured} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-brand font-semibold shadow-lg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"><LockKeyhole className="size-4" /> Sign in securely</button>
          </form>
          <p className="mt-6 text-center text-xs text-white/35">Protected by Supabase Auth and row-level security</p>
        </section>
      </div>
    </main>
  )
}
