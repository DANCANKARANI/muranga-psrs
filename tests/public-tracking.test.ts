import assert from "node:assert/strict";
import test from "node:test";
import { toPublicTracking } from "../lib/public-tracking";

test("public tracking returns status history and excludes private report details", () => {
  const createdAt = new Date("2026-10-01T10:00:00.000Z");
  const result = toPublicTracking({
    trackingId: "MCG-2026-AB12",
    category: "Water",
    status: "IN_PROGRESS",
    createdAt,
    location: "Private address",
    description: "Private report details",
    citizen: { name: "Jane" },
    updates: [{ status: "PENDING", createdAt, note: "Internal note", adminName: "Staff" }],
  });

  assert.deepEqual(result, {
    trackingId: "MCG-2026-AB12",
    category: "Water",
    status: "IN_PROGRESS",
    createdAt,
    updates: [{ status: "PENDING", createdAt }],
  });
  assert.equal("location" in result, false);
  assert.equal("description" in result, false);
  assert.equal("citizen" in result, false);
  assert.equal("note" in result.updates[0], false);
});
