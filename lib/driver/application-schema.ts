import { z } from "zod";

export const BODY_TYPES = [
  "sedan",
  "suv",
  "hatchback",
  "pickup",
  "van",
] as const;

export const ApplicationBody = z.object({
  action: z.enum(["draft", "submit"]),
  fullName: z.string().min(2).max(120).optional(),
  phone: z.string().max(32).optional(),
  nationalId: z.string().max(64).optional(),
  licenseNumber: z.string().max(64).optional(),
  licenseFrontPath: z.string().max(512).optional(),
  licenseBackPath: z.string().max(512).optional(),
  carPhotoPaths: z.array(z.string().max(512)).max(4).optional(),
  vehicleBodyType: z.enum(BODY_TYPES).optional(),
  vehicleYear: z.number().int().min(1980).max(2030).optional(),
  make: z.string().max(64).optional(),
  model: z.string().max(64).optional(),
  plateNumber: z.string().max(32).optional(),
  color: z.string().max(32).optional(),
  seats: z.number().int().min(2).max(8).optional(),
  requestedTierId: z.string().uuid().optional(),
});

export type ApplicationInput = z.infer<typeof ApplicationBody>;

export const UploadDocBody = z.object({
  docType: z.enum([
    "license_front",
    "license_back",
    "national_id",
    "car_1",
    "car_2",
    "car_3",
    "car_4",
  ]),
  contentType: z.string().regex(/^image\//),
  extension: z.string().max(8).optional(),
});

export function storagePathForDoc(
  profileId: string,
  docType: z.infer<typeof UploadDocBody>["docType"],
  ext: string,
): { bucket: string; path: string } {
  const safeExt = ext.replace(/[^a-z0-9]/gi, "").toLowerCase() || "jpg";
  if (docType.startsWith("car_")) {
    const idx = docType.split("_")[1];
    return {
      bucket: "vehicle-photos",
      path: `${profileId}/car/${idx}.${safeExt}`,
    };
  }
  const name =
    docType === "license_front"
      ? "license-front"
      : docType === "license_back"
        ? "license-back"
        : "national-id";
  return {
    bucket: "driver-documents",
    path: `${profileId}/${name}.${safeExt}`,
  };
}

export function validateSubmitPayload(input: ApplicationInput): string | null {
  if (!input.fullName?.trim()) return "Full name is required.";
  if (!input.nationalId?.trim()) return "National ID is required.";
  if (!input.licenseNumber?.trim()) return "License number is required.";
  if (!input.licenseFrontPath) return "License front photo is required.";
  if (!input.licenseBackPath) return "License back photo is required.";
  if (!input.carPhotoPaths || input.carPhotoPaths.length < 2) {
    return "At least two vehicle photos are required.";
  }
  if (input.carPhotoPaths.length > 4) {
    return "At most four vehicle photos are allowed.";
  }
  if (!input.vehicleBodyType) return "Vehicle body type is required.";
  if (!input.make?.trim()) return "Vehicle make is required.";
  if (!input.model?.trim()) return "Vehicle model is required.";
  if (!input.plateNumber?.trim()) return "Plate number is required.";
  if (!input.color?.trim()) return "Vehicle color is required.";
  if (!input.seats) return "Seat count is required.";
  if (!input.requestedTierId) return "Requested tier is required.";
  return null;
}
