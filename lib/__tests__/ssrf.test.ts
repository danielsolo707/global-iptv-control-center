import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { coerceIpv4Literal, isPrivateOrReservedIp, validatePublicHttpUrl } from "../ssrf"

describe("SSRF URL validator", () => {
  it("rejects non-http protocols", async () => {
    await assert.rejects(() => validatePublicHttpUrl("file:///etc/passwd"), /Only HTTP/)
    await assert.rejects(() => validatePublicHttpUrl("ftp://example.com/a"), /Only HTTP/)
  })

  it("rejects localhost and .local hosts", async () => {
    await assert.rejects(() => validatePublicHttpUrl("http://localhost/stream.m3u8"), /Private/)
    await assert.rejects(() => validatePublicHttpUrl("http://meta.local/stream"), /Private/)
  })

  it("rejects private IPv4 literals", async () => {
    await assert.rejects(() => validatePublicHttpUrl("http://127.0.0.1/x"), /Private/)
    await assert.rejects(() => validatePublicHttpUrl("http://10.0.0.5/x"), /Private/)
    await assert.rejects(() => validatePublicHttpUrl("http://192.168.1.1/x"), /Private/)
    await assert.rejects(() => validatePublicHttpUrl("http://169.254.169.254/latest"), /Private/)
    await assert.rejects(() => validatePublicHttpUrl("http://172.16.0.1/x"), /Private/)
  })

  it("rejects decimal and octal loopback encodings", async () => {
    await assert.rejects(() => validatePublicHttpUrl("http://2130706433/x"), /Private/)
    const coerced = coerceIpv4Literal("0177.0.0.1")
    assert.equal(coerced, "127.0.0.1")
    assert.equal(isPrivateOrReservedIp(coerced!), true)
  })

  it("rejects IPv6 loopback and unique-local", () => {
    assert.equal(isPrivateOrReservedIp("::1"), true)
    assert.equal(isPrivateOrReservedIp("fc00::1"), true)
    assert.equal(isPrivateOrReservedIp("fe80::1"), true)
  })

  it("accepts a public IPv4 https URL without DNS", async () => {
    // Use a well-known public unicast address so the test does not depend on
    // ambient DNS (some environments rewrite example.com to blackhole/private IPs).
    const url = await validatePublicHttpUrl("https://1.1.1.1/live/index.m3u8")
    assert.equal(url.hostname, "1.1.1.1")
    assert.equal(url.protocol, "https:")
  })
})
