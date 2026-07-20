import assert from "node:assert/strict"
import { describe, it } from "node:test"
import type { AdminRole } from "../admin/types"

const rank: Record<AdminRole, number> = { viewer: 1, moderator: 2, admin: 3 }

function canPerform(role: AdminRole, minimum: AdminRole): boolean {
  return rank[role] >= rank[minimum]
}

/** Mirrors app/api/admin/action/route.ts action → minimum role mapping. */
function minimumRoleFor(action: string): AdminRole {
  const adminOnly = new Set([
    "start-sync",
    "force-sync",
    "clear-cache",
    "save-settings",
    "remove-admin",
    "delete-channel",
  ])
  const viewerActions = new Set(["read"])
  if (adminOnly.has(action)) return "admin"
  if (viewerActions.has(action)) return "viewer"
  return "moderator"
}

describe("admin role authorization matrix", () => {
  it("allows viewers to export / read only", () => {
    assert.equal(canPerform("viewer", minimumRoleFor("read")), true)
    assert.equal(canPerform("viewer", minimumRoleFor("enable-channel")), false)
    assert.equal(canPerform("viewer", minimumRoleFor("start-sync")), false)
  })

  it("allows moderators channel/country/category ops but not system settings", () => {
    assert.equal(canPerform("moderator", minimumRoleFor("enable-channel")), true)
    assert.equal(canPerform("moderator", minimumRoleFor("toggle-country")), true)
    assert.equal(canPerform("moderator", minimumRoleFor("toggle-category")), true)
    assert.equal(canPerform("moderator", minimumRoleFor("save-settings")), false)
    assert.equal(canPerform("moderator", minimumRoleFor("start-sync")), false)
    assert.equal(canPerform("moderator", minimumRoleFor("remove-admin")), false)
  })

  it("allows admins full control", () => {
    for (const action of ["start-sync", "save-settings", "delete-channel", "enable-channel", "toggle-country"]) {
      assert.equal(canPerform("admin", minimumRoleFor(action)), true, action)
    }
  })
})
