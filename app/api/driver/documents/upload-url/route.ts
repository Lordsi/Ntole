import { NextResponse } from "next/server";
import { z } from "zod";

import { requireRole } from "@/lib/auth/session";
import {
  UploadDocBody,
  storagePathForDoc,
} from "@/lib/driver/application-schema";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
]);

export async function POST(request: Request) {
  const { profile } = await requireRole("driver", "admin");
  const body = UploadDocBody.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!ALLOWED_MIME.has(body.data.contentType)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, or WebP images are allowed." },
      { status: 400 },
    );
  }

  const ext =
    body.data.extension ??
    (body.data.contentType === "image/png"
      ? "png"
      : body.data.contentType === "image/webp"
        ? "webp"
        : "jpg");

  const { bucket, path } = storagePathForDoc(profile!.id, body.data.docType, ext);
  const admin = createServiceSupabaseClient();
  const { data, error } = await admin.storage
    .from(bucket)
    .createSignedUploadUrl(path);

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Could not create upload URL" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    bucket,
    path,
    signedUrl: data.signedUrl,
    token: data.token,
  });
}
