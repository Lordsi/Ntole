// Hand-written types for the Ntole schema. Keep in sync with
// supabase/migrations.

export type UserRole = "rider" | "driver" | "admin";
export type DriverStatus = "offline" | "online" | "on_trip";
export type DriverApprovalStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "rejected"
  | "banned";
export type ComplaintCategory = "safety" | "behavior" | "vehicle" | "other";
export type ComplaintStatus = "open" | "reviewed" | "dismissed";
export type DriverModerationAction =
  | "approve"
  | "reject"
  | "warn"
  | "ban"
  | "unban"
  | "set_tier"
  | "set_rating"
  | "verify";
export type RideStatus =
  | "requested"
  | "accepted"
  | "en_route_to_pickup"
  | "in_progress"
  | "completed"
  | "cancelled";
export type PaymentStatus =
  | "pending"
  | "authorized"
  | "paid"
  | "failed"
  | "refunded";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  rating: number;
  trip_count: number;
  safety_rating: number;
  /** Saved home pickup pin (optional). */
  home_lat: number | null;
  home_lng: number | null;
  home_address: string | null;
  created_at: string;
  updated_at: string;
}

export interface FavoriteDriver {
  rider_id: string;
  driver_id: string;
  created_at: string;
}

export interface RideTier {
  id: string;
  name: string;
  description: string;
  base_fare_minor: number;
  per_km_minor: number;
  per_minute_minor: number;
  min_fare_minor: number;
  currency: string;
  surge_multiplier: number;
  seats: number;
  sort_order: number;
  is_active: boolean;
}

export interface Vehicle {
  id: string;
  driver_id: string;
  tier_id: string;
  make: string;
  model: string;
  plate_number: string;
  color: string;
  seats: number;
}

export interface Driver {
  profile_id: string;
  vehicle_id: string | null;
  status: DriverStatus;
  current_lat: number | null;
  current_lng: number | null;
  last_seen_at: string | null;
  license_number: string | null;
  is_verified: boolean;
  approval_status: DriverApprovalStatus;
  national_id: string | null;
  national_id_normalized: string | null;
  license_number_normalized: string | null;
  license_front_path: string | null;
  license_back_path: string | null;
  car_photo_paths: string[];
  vehicle_body_type: string | null;
  requested_tier_id: string | null;
  admin_assigned_tier_id: string | null;
  vehicle_year: number | null;
  rating_override: number | null;
  rating_override_by: string | null;
  rating_override_at: string | null;
  warning_count: number;
  banned_at: string | null;
  ban_reason: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface BannedIdentifier {
  id: string;
  national_id_normalized: string | null;
  license_number_normalized: string | null;
  banned_profile_id: string;
  banned_by: string | null;
  reason: string;
  created_at: string;
}

export interface Complaint {
  id: string;
  reporter_id: string;
  subject_driver_id: string;
  ride_id: string | null;
  category: ComplaintCategory;
  body: string;
  status: ComplaintStatus;
  admin_notes: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DriverModerationEvent {
  id: string;
  driver_id: string;
  admin_id: string | null;
  action: DriverModerationAction;
  payload: Record<string, unknown>;
  notes: string | null;
  created_at: string;
}

export interface Ride {
  id: string;
  rider_id: string;
  driver_id: string | null;
  vehicle_id: string | null;
  tier_id: string;
  status: RideStatus;
  pickup_lat: number;
  pickup_lng: number;
  pickup_address: string;
  drop_lat: number;
  drop_lng: number;
  drop_address: string;
  quoted_distance_km: number;
  quoted_duration_min: number;
  actual_distance_km: number | null;
  actual_duration_min: number | null;
  fare_minor: number;
  currency: string;
  surge_multiplier: number;
  requested_at: string;
  accepted_at: string | null;
  arrived_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancellation_reason: string | null;
}

export interface Message {
  id: string;
  ride_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export interface Payment {
  id: string;
  ride_id: string;
  rider_id: string;
  provider: string;
  provider_intent_id: string | null;
  amount_minor: number;
  currency: string;
  status: PaymentStatus;
  created_at: string;
  updated_at: string;
}

export interface Rating {
  id: string;
  ride_id: string;
  rater_id: string;
  ratee_id: string;
  stars: number;
  comment: string;
  created_at: string;
}

export interface AppConfig {
  id: 1;
  default_currency: string;
  match_radius_km: number;
  driver_ping_seconds: number;
  surge_multiplier: number;
}

/** Display rating for a driver profile. */
export function driverDisplayRating(
  driver: Pick<Driver, "rating_override">,
  profile: Pick<Profile, "rating">,
): number {
  return driver.rating_override ?? profile.rating;
}
