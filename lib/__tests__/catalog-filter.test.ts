import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { statusFromFailCount } from "../stream-health"

/**
 * Public catalog filtering contract:
 * only online channels may be shown. Offline/blocked/removed/checking stay hidden.
 */
function isPubliclyVisible(status: string, countryEnabled: boolean, categoryEnabled: boolean): boolean {
  return status === "online" && countryEnabled && categoryEnabled
}

describe("public catalog visibility", () => {
  it("shows only online channels from enabled countries/categories", () => {
    assert.equal(isPubliclyVisible("online", true, true), true)
    assert.equal(isPubliclyVisible("checking", true, true), false)
    assert.equal(isPubliclyVisible("offline", true, true), false)
    assert.equal(isPubliclyVisible("blocked", true, true), false)
    assert.equal(isPubliclyVisible("removed", true, true), false)
    assert.equal(isPubliclyVisible("online", false, true), false)
    assert.equal(isPubliclyVisible("online", true, false), false)
  })

  it("aligns status thresholds with the product state machine", () => {
    assert.equal(statusFromFailCount(0), "online")
    assert.equal(statusFromFailCount(1), "checking")
    assert.equal(statusFromFailCount(3), "offline")
    assert.equal(statusFromFailCount(10), "blocked")
  })
})
