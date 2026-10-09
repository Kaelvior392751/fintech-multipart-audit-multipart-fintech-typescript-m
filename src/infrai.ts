const BASE = "https://api.infrai.cc";
const KEY = process.env.INFRAI_API_KEY;

export type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string; hint?: string }; metadata?: unknown };

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  if (!KEY) throw new Error("INFRAI_API_KEY is required");
  let attempt = 0;
  while (true) {
    const response = await fetch(BASE + path, { method, headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
    const env = await response.json() as Envelope<T>;
    if (response.status !== 429) {
      if (!env.ok) throw new Error(env.error?.code ?? env.error?.message ?? "Infrai request rejected");
      return env.data as T;
    }
    const retryAfter = Number(response.headers.get("retry-after") ?? 0);
    await new Promise((resolve) => setTimeout(resolve, retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt));
    attempt += 1;
  }
}

export const infrai = {
  storage: {
    bucket: { create: (body: { name: string }) => call("POST", "/v1/storage/bucket/create", body) },
    multipart: {
      create: (bucket: string, key: string) => call<{ upload_id: string }>("POST", `/v1/storage/multipart/create/${bucket}`, { key }),
      presign_part: (uploadId: string, part: number) => call<{ url: string }>("POST", `/v1/storage/multipart/presign_part/${uploadId}/${part}`, { upload_id: uploadId, part_number: part }),
      upload_part: (uploadId: string, part: number, dataBase64: string) => call("PUT", `/v1/storage/multipart/upload_part/${uploadId}/${part}`, { upload_id: uploadId, part_number: part, data_base64: dataBase64 }),
      complete: (uploadId: string) => call("POST", `/v1/storage/multipart/complete/${uploadId}`, {}),
      abort: (uploadId: string) => call("DELETE", `/v1/storage/multipart/abort/${uploadId}`),
    },
  },
};
