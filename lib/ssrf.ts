import { lookup } from "node:dns/promises"
import { isIP } from "node:net"

/**
 * SSRF-safe stream URL validation for admin-triggered probes.
 * Accepts only http(s), rejects private/link-local/loopback/metadata targets,
 * and resolves DNS before fetch so literal private hosts are blocked.
 */
export class UnsafeUrlError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "UnsafeUrlError"
  }
}

function normalizeHostname(hostname: string): string {
  // Strip IPv6 brackets if present.
  if (hostname.startsWith("[") && hostname.endsWith("]")) {
    return hostname.slice(1, -1)
  }
  // Reject trailing dots used to confuse resolvers inconsistently.
  return hostname.replace(/\.$/, "").toLowerCase()
}

function expandIPv6(ip: string): string {
  // Normalize for simple prefix checks after canonicalization via URL where possible.
  return ip.toLowerCase()
}

/** Returns true when an IP must never be contacted by stream tests. */
export function isPrivateOrReservedIp(ip: string): boolean {
  const value = expandIPv6(ip.trim())
  const version = isIP(value)
  if (version === 4) {
    const parts = value.split(".").map((part) => Number(part))
    if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
      return true
    }
    const [a, b] = parts
    if (a === 0) return true // "this" network
    if (a === 10) return true // RFC1918
    if (a === 127) return true // loopback
    if (a === 169 && b === 254) return true // link-local / cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true // RFC1918
    if (a === 192 && b === 168) return true // RFC1918
    if (a === 100 && b >= 64 && b <= 127) return true // shared address space
    if (a === 192 && b === 0 && parts[2] === 0) return true // IETF protocol assignments
    if (a === 192 && b === 0 && parts[2] === 2) return true // TEST-NET-1
    if (a === 198 && (b === 18 || b === 19)) return true // benchmarking
    if (a === 198 && b === 51 && parts[2] === 100) return true // TEST-NET-2
    if (a === 203 && b === 0 && parts[2] === 113) return true // TEST-NET-3
    if (a >= 224) return true // multicast + reserved
    return false
  }

  if (version === 6) {
    // Loopback
    if (value === "::1") return true
    // Unspecified
    if (value === "::" || value === "0:0:0:0:0:0:0:0") return true
    // IPv4-mapped IPv6 (:ffff:x.x.x.x)
    const mapped = value.match(/^:ffff:(\d+\.\d+\.\d+\.\d+)$/i) || value.match(/^0:0:0:0:0:ffff:(\d+\.\d+\.\d+\.\d+)$/i)
    if (mapped) return isPrivateOrReservedIp(mapped[1])
    // Unique local fc00::/7, link-local fe80::/10
    if (value.startsWith("fc") || value.startsWith("fd") || value.startsWith("fe8") || value.startsWith("fe9") || value.startsWith("fea") || value.startsWith("feb")) {
      return true
    }
    return false
  }

  // Unknown / non-IP strings are rejected by the caller after DNS resolution.
  return true
}

/** Parse dotted / decimal / octal / hex IPv4 forms into dotted-decimal when possible. */
export function coerceIpv4Literal(hostname: string): string | null {
  // Decimal integer form (e.g. 2130706433 => 127.0.0.1)
  if (/^\d+$/.test(hostname)) {
    try {
      const n = BigInt(hostname)
      if (n < 0n || n > 0xffffffffn) return null
      return [(n >> 24n) & 0xffn, (n >> 16n) & 0xffn, (n >> 8n) & 0xffn, n & 0xffn].map(String).join(".")
    } catch {
      return null
    }
  }

  // Octal / hex dotted forms: 0177.0.0.1, 0x7f.0.0.1
  if (/^(0x[0-9a-f]+|\d+)(\.(0x[0-9a-f]+|\d+)){0,3}$/i.test(hostname) && /[x.]/i.test(hostname)) {
    const parts = hostname.split(".")
    if (parts.length > 4) return null
    const nums: number[] = []
    for (const part of parts) {
      let value: number
      if (/^0x/i.test(part)) value = Number.parseInt(part.slice(2), 16)
      else if (/^0[0-7]+$/.test(part)) value = Number.parseInt(part, 8)
      else value = Number.parseInt(part, 10)
      if (!Number.isFinite(value) || value < 0) return null
      nums.push(value)
    }
    // Expand sparse notation similar to inet_aton (a.b.c with c as 16-bit, etc.)
    let a = 0
    let b = 0
    let c = 0
    let d = 0
    if (nums.length === 1) {
      a = (nums[0]! >>> 24) & 255
      b = (nums[0]! >>> 16) & 255
      c = (nums[0]! >>> 8) & 255
      d = nums[0]! & 255
    } else if (nums.length === 2) {
      a = nums[0]! & 255
      b = (nums[1]! >>> 16) & 255
      c = (nums[1]! >>> 8) & 255
      d = nums[1]! & 255
    } else if (nums.length === 3) {
      a = nums[0]! & 255
      b = nums[1]! & 255
      c = (nums[2]! >>> 8) & 255
      d = nums[2]! & 255
    } else {
      ;[a, b, c, d] = nums.map((n) => n & 255) as [number, number, number, number]
    }
    return `${a}.${b}.${c}.${d}`
  }

  return null
}

export async function validatePublicHttpUrl(raw: string): Promise<URL> {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new UnsafeUrlError("Invalid URL")
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new UnsafeUrlError("Only HTTP(S) streams are allowed")
  }

  if (url.username || url.password) {
    throw new UnsafeUrlError("Credentials in stream URLs are not allowed")
  }

  const hostname = normalizeHostname(url.hostname)
  if (!hostname) throw new UnsafeUrlError("Hostname is required")

  // Block obvious local names without DNS.
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local") || hostname.endsWith(".internal")) {
    throw new UnsafeUrlError("Private network targets are not allowed")
  }

  const coerced = coerceIpv4Literal(hostname)
  if (coerced) {
    if (isPrivateOrReservedIp(coerced)) throw new UnsafeUrlError("Private network targets are not allowed")
    return url
  }

  if (isIP(hostname)) {
    if (isPrivateOrReservedIp(hostname)) throw new UnsafeUrlError("Private network targets are not allowed")
    return url
  }

  let addresses: Array<{ address: string }>
  try {
    addresses = await lookup(hostname, { all: true, verbatim: true })
  } catch {
    throw new UnsafeUrlError("Unable to resolve stream hostname")
  }

  if (!addresses.length) throw new UnsafeUrlError("Unable to resolve stream hostname")
  if (addresses.some((item) => isPrivateOrReservedIp(item.address))) {
    throw new UnsafeUrlError("Private network targets are not allowed")
  }

  return url
}
