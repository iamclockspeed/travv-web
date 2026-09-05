export interface Coordinates {
  latitude: number;
  longitude: number;
  altitude: number;
}

export interface RoutePoint {
  id?: string | number;
  index: number;
  name: string;
  desc: string;
  station: boolean;
  coordinates: Coordinates;
  segment_km?: number;
  cumulative_km?: number;
}

export interface LiveLocsRecord {
  timestamp: number;
  lat: number;
  lng: number;
  alt: number;
}

export interface LiveStructuredRecord {
  locs: LiveLocsRecord;
}

export interface VehicleLiveStructuredStats {
  id: string | number;
  std: LiveStructuredRecord;
}

export interface VehicleRecord {
  id: string | number;
  registrationNumber: string;
}

export interface VehicleRouteProps {
  id: string | number;
  points: RoutePoint[];
}

export type StopStatus = "passed" | "current" | "upcoming";
