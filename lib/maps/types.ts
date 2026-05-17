export interface LatLng {
  lat: number;
  lng: number;
}

export interface RouteResult {
  distanceKm: number;
  durationMin: number;
  /** Encoded polyline (precision 5) of the route geometry, or null. */
  polyline: string | null;
  /** Raw coordinates [lat, lng][] for clients that decode themselves. */
  coordinates: [number, number][];
}

export interface PlaceSuggestion {
  label: string;
  lat: number;
  lng: number;
  /** Free-form address, may equal `label`. */
  address: string;
}
