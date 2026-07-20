import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { normalizeCountryCode, resolveStoredCountryCode } from "../country-codes"

describe("country code normalization", () => {
  it("maps UK to GB", () => {
    assert.equal(normalizeCountryCode("uk"), "GB")
    assert.equal(normalizeCountryCode("GB"), "GB")
    assert.equal(normalizeCountryCode("us"), "US")
  })

  it("resolves upstream GB onto a legacy UK-enabled catalog", () => {
    const enabled = new Map([["UK", "United Kingdom"], ["US", "United States"]])
    assert.equal(resolveStoredCountryCode("GB", enabled), "UK")
    assert.equal(resolveStoredCountryCode("US", enabled), "US")
    assert.equal(resolveStoredCountryCode("FR", enabled), null)
  })

  it("resolves upstream UK onto a GB-enabled catalog", () => {
    const enabled = new Map([["GB", "United Kingdom"]])
    assert.equal(resolveStoredCountryCode("UK", enabled), "GB")
    assert.equal(resolveStoredCountryCode("GB", enabled), "GB")
  })
})
