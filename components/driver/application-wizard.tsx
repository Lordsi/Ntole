"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MaterialIcon } from "@/components/ui/material-icon";
import { BODY_TYPES } from "@/lib/driver/application-schema";
import { cn } from "@/lib/utils/cn";
import type { Driver, Profile, RideTier } from "@/lib/supabase/types";

const STEPS = [
  "Personal",
  "License",
  "Vehicle",
  "Photos",
  "Review",
] as const;

interface InitialVehicle {
  make: string;
  model: string;
  plate_number: string;
  color: string;
  seats: number;
  tier_id: string;
}

interface ApplicationWizardProps {
  profile: Profile;
  driver: Driver | null;
  tiers: RideTier[];
  initialVehicle?: InitialVehicle | null;
}

export function ApplicationWizard({
  profile,
  driver,
  tiers,
  initialVehicle,
}: ApplicationWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState(profile.full_name);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [nationalId, setNationalId] = useState(driver?.national_id ?? "");
  const [licenseNumber, setLicenseNumber] = useState(
    driver?.license_number ?? "",
  );
  const [licenseFrontPath, setLicenseFrontPath] = useState(
    driver?.license_front_path ?? "",
  );
  const [licenseBackPath, setLicenseBackPath] = useState(
    driver?.license_back_path ?? "",
  );
  const [carPhotoPaths, setCarPhotoPaths] = useState<string[]>(
    driver?.car_photo_paths ?? [],
  );
  const [bodyType, setBodyType] = useState(driver?.vehicle_body_type ?? "sedan");
  const [vehicleYear, setVehicleYear] = useState(
    driver?.vehicle_year?.toString() ?? "",
  );
  const [make, setMake] = useState(initialVehicle?.make ?? "");
  const [model, setModel] = useState(initialVehicle?.model ?? "");
  const [plate, setPlate] = useState(initialVehicle?.plate_number ?? "");
  const [color, setColor] = useState(initialVehicle?.color ?? "");
  const [seats, setSeats] = useState(initialVehicle?.seats ?? 4);
  const [requestedTierId, setRequestedTierId] = useState(
    driver?.requested_tier_id ?? tiers[0]?.id ?? "",
  );

  const uploadFile = useCallback(
    async (
      docType:
        | "license_front"
        | "license_back"
        | "national_id"
        | "car_1"
        | "car_2"
        | "car_3"
        | "car_4",
      file: File,
    ) => {
      if (!file.type.startsWith("image/")) {
        throw new Error("Please pick an image file.");
      }
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("Each image must be 5 MB or smaller.");
      }

      const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
      const res = await fetch("/api/driver/documents/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docType,
          contentType: file.type,
          extension: ext,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");

      const uploadRes = await fetch(data.signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadRes.ok) throw new Error("Upload to storage failed");

      return data.path as string;
    },
    [],
  );

  async function save(action: "draft" | "submit") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/driver/application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          fullName,
          phone,
          nationalId,
          licenseNumber,
          licenseFrontPath: licenseFrontPath || undefined,
          licenseBackPath: licenseBackPath || undefined,
          carPhotoPaths,
          vehicleBodyType: bodyType,
          vehicleYear: vehicleYear ? Number(vehicleYear) : undefined,
          make,
          model,
          plateNumber: plate,
          color,
          seats,
          requestedTierId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save application");

      if (action === "submit") {
        router.push("/driver/onboarding");
        router.refresh();
      } else {
        setError(null);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function next() {
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  return (
    <div className="flex flex-col gap-lg max-w-xl">
      <div className="flex gap-xs flex-wrap">
        {STEPS.map((label, i) => (
          <span
            key={label}
            className={cn(
              "px-sm py-xs rounded-full font-label-sm text-label-sm uppercase tracking-wider",
              i === step
                ? "bg-primary-container text-on-primary-container"
                : "bg-surface-container text-on-surface-variant",
            )}
          >
            {label}
          </span>
        ))}
      </div>

      {driver?.approval_status === "submitted" && (
        <p className="font-body-md text-body-md text-primary-container">
          Your application is under review. You will be notified when an admin
          approves your account.
        </p>
      )}
      {driver?.approval_status === "rejected" && driver.rejection_reason && (
        <p className="font-body-md text-body-md text-error" role="alert">
          Rejected: {driver.rejection_reason}
        </p>
      )}
      {driver?.approval_status === "banned" && (
        <p className="font-body-md text-body-md text-error" role="alert">
          {driver.ban_reason ?? "Your driver account has been banned."}
        </p>
      )}

      {step === 0 && (
        <section className="glass-panel rounded-lg p-lg flex flex-col gap-md">
          <h2 className="font-headline-md text-headline-md text-on-surface">
            Personal details
          </h2>
          <Input
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <Input
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Input
            placeholder="National ID number"
            value={nationalId}
            onChange={(e) => setNationalId(e.target.value)}
          />
        </section>
      )}

      {step === 1 && (
        <section className="glass-panel rounded-lg p-lg flex flex-col gap-md">
          <h2 className="font-headline-md text-headline-md text-on-surface">
            Driver license
          </h2>
          <Input
            placeholder="License number"
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
          />
          <DocUploadField
            label="License front"
            path={licenseFrontPath}
            onPick={async (file) => {
              const path = await uploadFile("license_front", file);
              setLicenseFrontPath(path);
            }}
          />
          <DocUploadField
            label="License back"
            path={licenseBackPath}
            onPick={async (file) => {
              const path = await uploadFile("license_back", file);
              setLicenseBackPath(path);
            }}
          />
        </section>
      )}

      {step === 2 && (
        <section className="glass-panel rounded-lg p-lg flex flex-col gap-md">
          <h2 className="font-headline-md text-headline-md text-on-surface">
            Vehicle
          </h2>
          <div className="grid grid-cols-2 gap-md">
            <Input placeholder="Make" value={make} onChange={(e) => setMake(e.target.value)} />
            <Input placeholder="Model" value={model} onChange={(e) => setModel(e.target.value)} />
          </div>
          <Input
            placeholder="Year (optional)"
            type="number"
            value={vehicleYear}
            onChange={(e) => setVehicleYear(e.target.value)}
          />
          <Input placeholder="Color" value={color} onChange={(e) => setColor(e.target.value)} />
          <Input
            placeholder="Plate number"
            value={plate}
            onChange={(e) => setPlate(e.target.value.toUpperCase())}
          />
          <select
            value={bodyType}
            onChange={(e) => setBodyType(e.target.value)}
            className="h-12 rounded-2xl bg-surface px-4 text-sm ring-1 ring-white/5"
          >
            {BODY_TYPES.map((t) => (
              <option key={t} value={t} className="bg-background capitalize">
                {t}
              </option>
            ))}
          </select>
          <Input
            type="number"
            min={2}
            max={8}
            placeholder="Seats"
            value={String(seats)}
            onChange={(e) => setSeats(Number(e.target.value))}
          />
          <label className="font-label-sm text-label-sm text-on-surface-variant">
            Requested tier (admin assigns final tier at approval)
          </label>
          <select
            value={requestedTierId}
            onChange={(e) => setRequestedTierId(e.target.value)}
            className="h-12 rounded-2xl bg-surface px-4 text-sm ring-1 ring-white/5"
          >
            {tiers.map((t) => (
              <option key={t.id} value={t.id} className="bg-background">
                {t.name}
              </option>
            ))}
          </select>
        </section>
      )}

      {step === 3 && (
        <section className="glass-panel rounded-lg p-lg flex flex-col gap-md">
          <h2 className="font-headline-md text-headline-md text-on-surface">
            Vehicle photos (2–4)
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Include exterior and interior shots.
          </p>
          {(["car_1", "car_2", "car_3", "car_4"] as const).map((docType, i) => (
            <DocUploadField
              key={docType}
              label={`Photo ${i + 1}${i < 2 ? " (required)" : ""}`}
              path={carPhotoPaths[i] ?? ""}
              onPick={async (file) => {
                const path = await uploadFile(docType, file);
                setCarPhotoPaths((prev) => {
                  const next = [...prev];
                  next[i] = path;
                  return next.filter(Boolean);
                });
              }}
            />
          ))}
        </section>
      )}

      {step === 4 && (
        <section className="glass-panel rounded-lg p-lg flex flex-col gap-sm font-body-md text-body-md text-on-surface-variant">
          <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">
            Review
          </h2>
          <p>Name: {fullName}</p>
          <p>National ID: {nationalId || "—"}</p>
          <p>License: {licenseNumber || "—"}</p>
          <p>
            Vehicle: {make} {model} · {plate} · {bodyType}
          </p>
          <p>Photos: {carPhotoPaths.length} uploaded</p>
          <p className="text-on-surface-variant text-label-sm">
            Submitting sets your status to pending admin review. You cannot go
            online until approved.
          </p>
        </section>
      )}

      {error && (
        <p className="font-label-md text-label-md text-error" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-md">
        {step > 0 && (
          <Button type="button" variant="secondary" onClick={back} disabled={busy}>
            Back
          </Button>
        )}
        {step < STEPS.length - 1 && (
          <Button type="button" onClick={next} disabled={busy}>
            Continue
          </Button>
        )}
        {step === STEPS.length - 1 && (
          <>
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => save("draft")}
            >
              Save draft
            </Button>
            <Button
              type="button"
              disabled={busy || driver?.approval_status === "submitted"}
              onClick={() => save("submit")}
            >
              {busy ? "Submitting…" : "Submit application"}
            </Button>
          </>
        )}
        {step < STEPS.length - 1 && (
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() => save("draft")}
          >
            Save draft
          </Button>
        )}
      </div>
    </div>
  );
}

function DocUploadField({
  label,
  path,
  onPick,
}: {
  label: string;
  path: string;
  onPick: (file: File) => Promise<void>;
}) {
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-xs">
      <span className="font-label-sm text-label-sm text-on-surface-variant">
        {label}
      </span>
      <label className="inline-flex items-center gap-sm cursor-pointer">
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setUploading(true);
            setLocalError(null);
            try {
              await onPick(file);
            } catch (err) {
              setLocalError((err as Error).message);
            } finally {
              setUploading(false);
              e.target.value = "";
            }
          }}
        />
        <span className="inline-flex items-center gap-xs px-md py-sm rounded-full bg-surface-container ring-1 ring-white/10 font-label-sm">
          <MaterialIcon name="upload" className="text-[18px]" />
          {uploading ? "Uploading…" : path ? "Replace" : "Upload"}
        </span>
        {path && (
          <span className="font-label-sm text-label-sm text-primary-container truncate max-w-[200px]">
            Saved
          </span>
        )}
      </label>
      {localError && (
        <span className="text-label-sm text-error">{localError}</span>
      )}
    </div>
  );
}
