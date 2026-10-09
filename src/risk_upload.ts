import { z } from "zod";
import { infrai } from "./infrai.js";

export const uploadRequest = z.object({ accountId: z.string().min(1), objectKey: z.string().min(1), mediaBytes: z.number().int().positive(), paymentEventId: z.string().min(1) });
export type UploadRequest = z.infer<typeof uploadRequest>;
export type Decision = { action: "upload" | "review"; reason: string };

export function decideRisk(input: UploadRequest): Decision {
  if (input.mediaBytes > 500_000_000) return { action: "review", reason: "large_media_requires_manual_review" };
  return { action: "upload", reason: "within_media_policy" };
}

export async function startMediaUpload(raw: unknown, bucket: string): Promise<{ decision: Decision; uploadId?: string }> {
  const input = uploadRequest.parse(raw);
  const decision = decideRisk(input);
  if (decision.action === "review") return { decision };
  await infrai.storage.bucket.create({ name: bucket });
  const created = await infrai.storage.multipart.create(bucket, input.objectKey);
  return { decision, uploadId: created.upload_id };
}
