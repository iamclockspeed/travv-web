import type { DivIcon, Icon } from "leaflet";
import { makeAlertIcon, makeStopIcon, makeVehicleIcon } from "./mapIcons";

/**
 * Leaflet treats a new icon object as a changed prop even when the visual
 * output is identical, which forces Marker to tear down and rebuild its DOM
 * node. Since makeVehicleIcon/makeStopIcon/makeAlertIcon are pure functions
 * of a small set of inputs, we cache by that input signature so repeated
 * calls with the same arguments return the exact same object reference.
 */
function createCache<Args extends unknown[], R>(
  factory: (...args: Args) => R,
  keyFn: (...args: Args) => string,
) {
  const cache = new Map<string, R>();
  return (...args: Args): R => {
    const key = keyFn(...args);
    const cached = cache.get(key);
    if (cached) return cached;
    const value = factory(...args);
    cache.set(key, value);
    return value;
  };
}

export const getVehicleIcon = createCache(
  (isSelected: boolean, status: string): DivIcon | Icon =>
    makeVehicleIcon(isSelected, status),
  (isSelected, status) => `${isSelected}-${status}`,
);

export const getStopIcon = createCache(
  (label: string, color: string): DivIcon | Icon => makeStopIcon(label, color),
  (label, color) => `${label}-${color}`,
);

export const getAlertIcon = createCache(
  (message: string): DivIcon | Icon => makeAlertIcon(message),
  (message) => message,
);
