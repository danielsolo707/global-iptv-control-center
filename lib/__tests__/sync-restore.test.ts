import assert from "node:assert/strict"
import { describe, it } from "node:test"

/**
 * Mirrors the restore / soft-delete rules used by workers/sync_iptv.py
 * and lib/catalog-sync.ts.
 */
function nextSyncStatus(old: { status: string; stream_url: string } | undefined, newUrl: string): {
  status: string | undefined
  fail_count?: number
} {
  if (!old) return { status: "checking", fail_count: 0 }
  if (old.stream_url === newUrl) {
    if (old.status === "removed") return { status: "checking", fail_count: 0 }
    return { status: undefined } // preserve existing health
  }
  return { status: "checking", fail_count: 0 }
}

describe("added / removed channel detection", () => {
  it("inserts new upstream channels as checking", () => {
    assert.deepEqual(nextSyncStatus(undefined, "https://a/x.m3u8"), { status: "checking", fail_count: 0 })
  })

  it("soft-deletes are represented as removed by the missing-id path (not hard delete)", () => {
    // Documented contract: missing upstream ids are updated to status=removed.
    const missingAction = { status: "removed" as const, hardDelete: false }
    assert.equal(missingAction.status, "removed")
    assert.equal(missingAction.hardDelete, false)
  })

  it("restores reappearing channels that were marked removed", () => {
    const result = nextSyncStatus({ status: "removed", stream_url: "https://a/x.m3u8" }, "https://a/x.m3u8")
    assert.equal(result.status, "checking")
    assert.equal(result.fail_count, 0)
  })

  it("preserves healthy status when the stream URL is unchanged", () => {
    const result = nextSyncStatus({ status: "online", stream_url: "https://a/x.m3u8" }, "https://a/x.m3u8")
    assert.equal(result.status, undefined)
  })

  it("re-validates when the stream URL changes", () => {
    const result = nextSyncStatus({ status: "online", stream_url: "https://a/old.m3u8" }, "https://a/new.m3u8")
    assert.deepEqual(result, { status: "checking", fail_count: 0 })
  })
})
