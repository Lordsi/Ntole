"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MaterialIcon } from "@/components/ui/material-icon";
import { LocationInput } from "@/components/rider/location-input";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import type { Profile } from "@/lib/supabase/types";
import type { PlaceSuggestion } from "@/lib/maps/types";

interface ProfileFormProps {
  profile: Profile;
  /** Where to send the user after they delete their account. */
  redirectAfterDelete?: string;
}

/**
 * Account settings card. Manages:
 *   - Avatar (click avatar → upload image to `avatars/<user>/avatar.<ext>`)
 *   - Full name + phone
 *   - "Home" pickup pin (geocoded via /api/geocode)
 *   - Danger zone: delete account (calls /api/profile, which uses the
 *     service-role key to remove the auth user).
 *
 * All writes go straight to Supabase via the user's session — the only
 * server hop is for account deletion, which has to bypass RLS to touch
 * `auth.users`.
 */
export function ProfileForm({
  profile,
  redirectAfterDelete = "/login",
}: ProfileFormProps) {
  const router = useRouter();

  const [fullName, setFullName] = useState(profile.full_name);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url);
  const [home, setHome] = useState<PlaceSuggestion | null>(
    profile.home_address && profile.home_lat != null && profile.home_lng != null
      ? {
          label: profile.home_address,
          address: profile.home_address,
          lat: profile.home_lat,
          lng: profile.home_lng,
        }
      : null,
  );

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadAvatar(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please pick an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Avatar must be 5 MB or smaller.");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      // Stable key keeps storage tidy; cache-buster forces the new image to
      // render immediately even though the URL is unchanged.
      const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
      const path = `${profile.id}/avatar.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = `${data.publicUrl}?v=${Date.now()}`;
      const { error: profErr } = await supabase
        .from("profiles")
        .update({ avatar_url: url })
        .eq("id", profile.id);
      if (profErr) throw profErr;
      setAvatarUrl(url);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const supabase = createBrowserSupabaseClient();
      const { error: upErr } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          phone: phone || null,
          home_lat: home?.lat ?? null,
          home_lng: home?.lng ?? null,
          home_address: home?.label ?? null,
        })
        .eq("id", profile.id);
      if (upErr) throw upErr;
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-md">
      <Card className="flex flex-col gap-md">
        <div className="flex items-center gap-md">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="relative group rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-container focus-visible:outline-offset-2"
            aria-label="Change profile picture"
          >
            <Avatar name={fullName || "User"} src={avatarUrl} size={72} />
            <span
              className={cn(
                "absolute inset-0 grid place-items-center rounded-full bg-black/60 text-primary-container transition-opacity",
                uploading
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100",
              )}
            >
              <MaterialIcon
                name={uploading ? "progress_activity" : "photo_camera"}
                className={uploading ? "animate-spin" : ""}
              />
            </span>
          </button>
          <div className="flex flex-col">
            <p className="font-label-sm text-label-sm uppercase tracking-[0.16em] text-on-surface-variant">
              Profile picture
            </p>
            <p className="font-body-md text-body-md text-on-surface">
              Tap the photo to upload a new one.
            </p>
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              JPG or PNG, up to 5 MB.
            </p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadAvatar(file);
              e.target.value = "";
            }}
          />
        </div>
      </Card>

      <form onSubmit={save} className="flex flex-col gap-md">
        <Card className="flex flex-col gap-md">
          <p className="font-label-sm text-label-sm uppercase tracking-[0.16em] text-on-surface-variant">
            Personal details
          </p>
          <Input
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            leading={<MaterialIcon name="badge" className="text-[20px]" />}
          />
          <Input
            placeholder="Phone number"
            value={phone}
            inputMode="tel"
            onChange={(e) => setPhone(e.target.value)}
            leading={<MaterialIcon name="phone" className="text-[20px]" />}
          />
        </Card>

        <Card className="flex flex-col gap-md">
          <p className="font-label-sm text-label-sm uppercase tracking-[0.16em] text-on-surface-variant">
            Home location
          </p>
          <LocationInput
            label="Saved home"
            placeholder="Search for your home address"
            variant="pickup"
            value={home}
            onChange={setHome}
          />
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            We use this to pre-fill your pickup so you can book a ride home in
            one tap.
          </p>
        </Card>

        <button
          type="submit"
          disabled={saving}
          className={cn(
            "h-12 rounded-full font-label-md text-label-md font-bold uppercase tracking-[0.08em] transition-colors",
            saving
              ? "bg-surface-container-highest text-on-surface-variant cursor-wait"
              : "bg-primary-container text-on-primary-container shadow-glow hover:bg-primary-fixed",
          )}
        >
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save changes"}
        </button>
        {error && (
          <p className="font-label-md text-label-md text-error" role="alert">
            {error}
          </p>
        )}
      </form>

      <DeleteAccountCard redirectAfterDelete={redirectAfterDelete} />
    </div>
  );
}

function DeleteAccountCard({
  redirectAfterDelete,
}: {
  redirectAfterDelete: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function destroy() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/profile", { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to delete account");
      }
      const supabase = createBrowserSupabaseClient();
      await supabase.auth.signOut();
      router.push(redirectAfterDelete);
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <Card className="border border-error/30 bg-error/[0.04] flex flex-col gap-md">
      <div className="flex items-center gap-sm">
        <MaterialIcon name="warning" className="text-error" />
        <p className="font-label-md text-label-md uppercase tracking-[0.12em] text-error">
          Danger zone
        </p>
      </div>
      <p className="font-body-md text-body-md text-on-surface">
        Deleting your account permanently removes your profile, ride history,
        saved location, and any in-app conversations. This action can not be
        undone.
      </p>
      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="h-12 self-start rounded-full px-lg border border-error/40 text-error font-label-md text-label-md font-bold uppercase tracking-[0.08em] hover:bg-error/10 transition-colors"
        >
          Delete account
        </button>
      ) : (
        <div className="flex flex-col gap-sm">
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            Type <span className="font-mono text-error">DELETE</span> below to
            confirm.
          </p>
          <Input
            placeholder="DELETE"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex gap-sm">
            <button
              type="button"
              onClick={() => {
                setConfirming(false);
                setText("");
                setErr(null);
              }}
              disabled={busy}
              className="h-12 flex-1 rounded-full font-label-md text-label-md font-bold uppercase tracking-[0.08em] bg-surface-container-highest text-on-surface hover:bg-surface-container-high transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={destroy}
              disabled={busy || text !== "DELETE"}
              className="h-12 flex-1 rounded-full font-label-md text-label-md font-bold uppercase tracking-[0.08em] bg-error text-on-error hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {busy ? "Deleting…" : "Permanently delete"}
            </button>
          </div>
          {err && (
            <p className="font-label-md text-label-md text-error" role="alert">
              {err}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
