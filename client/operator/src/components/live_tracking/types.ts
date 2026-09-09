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
  ts: number;
  lat: number;
  lng: number;
  alt: number;
}

export interface LiveAlertsRecord {
  ts: number;
  evt: number;
  type: string;
  message: string;
  locs: {
    lat: number;
    lng: number;
    alt: number;
  };
}

export interface LiveStructuredRecord {
  ts: number;
  locs: LiveLocsRecord;
  alerts?: {
    ts: number;
    list: LiveAlertsRecord[];
  };
  general?: {
    ts: number;
    status: string;
    ignition: string;
    moving: string;
  };
}

export interface VehicleLiveStructuredStats {
  id: string | number;
  std: LiveStructuredRecord;
}

export interface VehicleRecord {
  id: string | number;
  registrationNumber: string;
  type: string;
  make: string;
  model: string;
  images: {
    url: string;
  }[];
  device?: {
    structuredTrackingData?: LiveStructuredRecord;
  };
}

export interface VehicleRouteProps {
  id: string | number;
  points: RoutePoint[];
}

export type StopStatus = "passed" | "current" | "upcoming";
