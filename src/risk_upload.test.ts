import assert from "node:assert/strict";
import { decideRisk } from "./risk_upload.js";

const result = decideRisk({ accountId: "acct-42", objectKey: "claims/scan.dcm", mediaBytes: 600_000_000, paymentEventId: "pay-9" });
assert.deepEqual(result, { action: "review", reason: "large_media_requires_manual_review" });
console.log("risk decision: large media is held for review");
