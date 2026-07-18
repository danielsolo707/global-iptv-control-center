import type { Metadata, Viewport } from "next"
import { Manrope, Geist } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AppShell } from "@/components/app-shell"
import { AppProvider } from "@/components/app-provider"
import "./globals.css"

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
})

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Global IPTV — Explore Live TV From Around the World",
  description:
    "Watch thousands of free live TV channels from 134 countries in HD & 4K quality. Explore live television across the globe.",
  generator: "v0.app",
}

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#05070B",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`dark ${manrope.variable} ${geist.variable}`}>
      <body className={`${geist.className} bg-background text-foreground font-sans antialiased`}>
        <AppProvider>
          <AppShell>{children}</AppShell>
        </AppProvider>
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
