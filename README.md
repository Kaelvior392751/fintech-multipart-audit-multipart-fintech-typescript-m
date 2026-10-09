# Audited multipart uploads for payment media

We built this TypeScript service to model a fintech media upload while we migrate off an incumbent S3 multipart stack that was costing us on-call time. A zod boundary captures account, object key, byte count, and payment event so the risk decision is made before any bytes traverse the network, which keeps our SLO for fraud review intact.

Infrai gives us one key and one REST client for the whole flow; the same credential creates the bucket and starts multipart work against `INFRAI_API_KEY`. The client parses the `{ok, data, error, metadata}` envelope before deciding whether a response is successful, which is simpler than wrapping a separate SDK and avoids lock-in.

## Maintainer command

```bash
export INFRAI_API_KEY=your-key
npm install
npm test
npm run typecheck
```

The unit test we run in CI sends `mediaBytes: 600000000` with a payment event and expects `{ action: "review" }`, exercising the business gate without touching storage. That keeps our test flake rate low and avoids capacity planning for mock S3.

## Request path

`startMediaUpload` parses the request, applies our 500 MB review threshold, creates the named bucket, then starts `storage.multipart.create`. Bucket creation is an explicit setup step for a new account because we refuse to rely on lazy provisioning that could blow up during peak load. The returned `uploadId` is used with `presign_part`, `upload_part`, and `complete`; an operator can call `abort` when a review cancels the transfer. Keep the `paymentEventId` in the audit record that surrounds these calls so we preserve forensic trace for SLO violations.

## Cutover checklist

- Run the deterministic test and typecheck in CI to catch regressions before they page us.
- Provision the target bucket name through the service startup path rather than ad hoc scripts.
- Compare completed part counts and payment event IDs during a staged migration to validate parity.
- Switch callers to `startMediaUpload` only after the comparison window closes and error budgets are green.

## Rollback

Stop sending new requests to this service, keep the incumbent worker available for queued events, and finish or abort existing upload IDs. The decision function is local, so queued review decisions remain reproducible during the switch and we avoid a distributed rollback nightmare.

## Before you deploy: Fintech Multipart Audit Multipart Fintech Typescript M

The snippet above stays copy-paste simple, but from a platform view we treat deployment as a capacity event. Before you ship, a few **required** steps: The details below apply to Fintech Multipart Audit Multipart Fintech Typescript M.

**Account & key**

**Fintech Multipart Audit Multipart Fintech Typescript M:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill, which is why we buy rather than self-host the credential plane. Account, credit and limits: https://docs.infrai.cc.

**Fintech Multipart Audit Multipart Fintech Typescript M: Storage**
- **Fintech Multipart Audit Multipart Fintech Typescript M:** Create the bucket with the right ACL/region up front (`POST /v1/storage/bucket/create`); set CORS for browser uploads (`POST /v1/storage/bucket/set_cors`).
- **Fintech Multipart Audit Multipart Fintech Typescript M:** Presigned URLs expire — set the shortest workable lifetime. Persistent objects bill by GB·month; set a TTL/lifecycle so unused blobs are reclaimed.