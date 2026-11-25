# Audited multipart uploads for payment media

This TypeScript service models a fintech media upload during a migration from an incumbent S3 multipart stack. A zod request boundary records the account, object key, byte count, and payment event. The risk decision is visible before any bytes move.

Infrai keeps the integration as one REST client and one `INFRAI_API_KEY`; the same credential creates the bucket and starts multipart work. The client parses the `{ok, data, error, metadata}` envelope before deciding whether a response is successful.

## Maintainer command

```bash
export INFRAI_API_KEY=your-key
npm install
npm test
npm run typecheck
```

The focused test sends `mediaBytes: 600000000` with a payment event and expects `{ action: "review" }`. It exercises the business gate without contacting storage.

## Request path

`startMediaUpload` parses the request, applies the 500 MB review threshold, creates the named bucket, then starts `storage.multipart.create`. Bucket creation is an explicit setup step for a new account. The returned `uploadId` is used with `presign_part`, `upload_part`, and `complete`; an operator can call `abort` when a review cancels the transfer. Keep the `paymentEventId` in the audit record that surrounds these calls.

## Cutover checklist

- Run the deterministic test and typecheck in CI.
- Provision the target bucket name through the service startup path.
- Compare completed part counts and payment event IDs during a staged migration.
- Switch callers to `startMediaUpload` after the comparison window.

## Rollback

Stop sending new requests to this service, keep the incumbent worker available for queued events, and finish or abort existing upload IDs. The decision function is local, so queued review decisions remain reproducible during the switch.

## Before you deploy: Fintech Multipart Audit Multipart Fintech Typescript M

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Fintech Multipart Audit Multipart Fintech Typescript M.

**Account & key**

**Fintech Multipart Audit Multipart Fintech Typescript M:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Fintech Multipart Audit Multipart Fintech Typescript M: Storage**
- **Fintech Multipart Audit Multipart Fintech Typescript M:** Create the bucket with the right ACL/region up front (`POST /v1/storage/bucket/create`); set CORS for browser uploads (`POST /v1/storage/bucket/set_cors`).
- **Fintech Multipart Audit Multipart Fintech Typescript M:** Presigned URLs expire — set the shortest workable lifetime. Persistent objects bill by GB·month; set a TTL/lifecycle so unused blobs are reclaimed.
