import type { LatLngTuple } from "leaflet";
import type { VehicleLiveStructuredStats } from "./types";

export const getLocLatLng = (
  loc: VehicleLiveStructuredStats | null | undefined,
): LatLngTuple => [loc?.std?.locs?.lat ?? 0, loc?.std?.locs?.lng ?? 0];

export const formatKm = (km: number) =>
  km < 1 ? `${(km * 1000).toFixed(0)} m` : `${km.toFixed(2)} km`;
