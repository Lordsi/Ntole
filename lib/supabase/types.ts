// Hand-written types for the Ntole schema. Keep in sync with
// supabase/migrations/0001_init.sql.

export type UserRole = "rider" | "driver" | "admin";
export type DriverStatus = "offline" | "online" | "on_trip";
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
  created_at: string;
  updated_at: string;
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
