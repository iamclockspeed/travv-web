import type { LatLngTuple } from "leaflet";
import type { StopStatus } from "./types";

export const POLL_INTERVAL_MS = 10000;
export const MAX_TRAIL_POINTS = 50;
export const DEFAULT_CENTER: LatLngTuple = [21.5300211, 83.858938]; // India fallback
export const DEFAULT_ZOOM = 10;
export const SELECTED_ZOOM = 10;

export const STOP_COLORS: Record<StopStatus, string> = {
  passed: "#a8ff3e",
  current: "#00e5ff",
  upcoming: "#ffcd00",
};
