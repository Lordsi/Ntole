import { createServiceSupabaseClient } from "@/lib/supabase/server";

export async function signedStorageUrl(
  bucket: string,
  path: string | null | undefined,
  expiresIn = 3600,
): Promise<string | null> {
  if (!path) return null;
  const admin = createServiceSupabaseClient();
  const { data, error } = await admin.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export function bucketForPath(path: string): string {
  return path.includes("/car/") ? "vehicle-photos" : "driver-documents";
}
