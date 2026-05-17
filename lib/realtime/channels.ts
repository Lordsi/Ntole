/** Channel helpers for Supabase Realtime so producers and consumers stay in sync. */

export const channels = {
  /** Per-ride channel: status updates and chat messages. */
  ride: (rideId: string) => `ride:${rideId}`,
  /** Driver location updates broadcast to nearby riders. */
  driverLocation: (driverId: string) => `driver:${driverId}:location`,
  /** Incoming requests fan-out for any online driver in a tier. */
  tierRequests: (tierId: string) => `tier:${tierId}:requests`,
} as const;
