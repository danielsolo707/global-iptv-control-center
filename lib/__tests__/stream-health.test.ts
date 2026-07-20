import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { applyStreamCheck, isProbeableStatus, nextFailCount, statusFromFailCount } from "../stream-health"

describe("stream health state machine", () => {
  it("resets to online on success", () => {
    assert.deepEqual(applyStreamCheck(9, true), { status: "online", failCount: 0 })
    assert.deepEqual(applyStreamCheck(0, true), { status: "online", failCount: 0 })
  })

  it("moves 1 failure to checking", () => {
    assert.deepEqual(applyStreamCheck(0, false), { status: "checking", failCount: 1 })
    assert.equal(statusFromFailCount(2), "checking")
  })

  it("moves 3 consecutive failures to offline", () => {
    assert.deepEqual(applyStreamCheck(2, false), { status: "offline", failCount: 3 })
    assert.equal(statusFromFailCount(9), "offline")
  })

  it("moves 10 consecutive failures to blocked", () => {
    assert.deepEqual(applyStreamCheck(9, false), { status: "blocked", failCount: 10 })
    assert.equal(statusFromFailCount(25), "blocked")
  })

  it("increments fail count without drift on repeated failures", () => {
    let count = 0
    for (let i = 0; i < 12; i += 1) count = nextFailCount(count, false)
    assert.equal(count, 12)
    assert.equal(statusFromFailCount(count), "blocked")
  })

  it("includes blocked channels in the probe set so they can recover", () => {
    assert.equal(isProbeableStatus("blocked"), true)
    assert.equal(isProbeableStatus("removed"), false)
    assert.equal(isProbeableStatus("online"), true)
  })
})
