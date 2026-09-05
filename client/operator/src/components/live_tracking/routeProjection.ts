// ─────────────────────────────────────────────────────────────
//  routeProjection.ts
//  Polyline projection & distance-to-stop utilities
// ─────────────────────────────────────────────────────────────

export interface Coordinates {
  latitude: number;
  longitude: number;
  altitude?: number;
}

export interface RoutePoint {
  index: number;
  name?: string;
  desc?: string;
  station?: boolean;
  coordinates: Coordinates;
  segment_km?: number;
  cumulative_km?: number;
}

export interface ProjectionResult {
  /** Closest point on the polyline to the vehicle */
  projectedLat: number;
  projectedLng: number;
  /** Straight-line distance from vehicle to the projected point (metres) */
  perpendicularDistanceM: number;
  /** Whether the vehicle is considered "on" the route (within threshold) */
  isOnRoute: boolean;
  /** Distance travelled along the route to the projected point (km) */
  projectedKm: number;
  /** Index of the segment [segmentIndex, segmentIndex+1] where projection landed */
  segmentIndex: number;
}

export interface StopDistance {
  stop: RoutePoint;
  /** Signed distance along the route (km).
   *  Positive  → stop is AHEAD of the vehicle
   *  Negative  → stop is BEHIND the vehicle */
  distanceKm: number;
  distanceM: number;
  direction: "ahead" | "behind" | "at";
}

// ─── Core math ───────────────────────────────────────────────

/**
 * Haversine distance between two lat/lng points (returns km).
 */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Project point P onto segment AB.
 * Works in flat (lng/lat) space — accurate enough for short urban routes.
 * For very long routes consider projecting in a local metric CRS instead.
 *
 * @returns Closest point on the segment and clamped t ∈ [0, 1]
 */
export function projectOnSegment(
  pLat: number,
  pLng: number,
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): { t: number; closestLat: number; closestLng: number; distKm: number } {
  const dx = bLng - aLng;
  const dy = bLat - aLat;
  const len2 = dx * dx + dy * dy;

  if (len2 === 0) {
    // Degenerate segment (A === B)
    return {
      t: 0,
      closestLat: aLat,
      closestLng: aLng,
      distKm: haversineKm(pLat, pLng, aLat, aLng),
    };
  }

  const t = Math.max(
    0,
    Math.min(1, ((pLng - aLng) * dx + (pLat - aLat) * dy) / len2),
  );

  const closestLng = aLng + t * dx;
  const closestLat = aLat + t * dy;

  return {
    t,
    closestLat,
    closestLng,
    distKm: haversineKm(pLat, pLng, closestLat, closestLng),
  };
}

// ─── Cumulative km along all route points ────────────────────

/**
 * Build a cumulative-km array parallel to routePoints.
 * cumKm[i] = distance from routePoints[0] to routePoints[i] along the polyline.
 */
export function buildCumulativeKm(routePoints: RoutePoint[]): number[] {
  const cumKm: number[] = [0];
  for (let i = 1; i < routePoints.length; i++) {
    const prev = routePoints[i - 1].coordinates;
    const cur = routePoints[i].coordinates;
    cumKm.push(
      cumKm[i - 1] +
        haversineKm(prev.latitude, prev.longitude, cur.latitude, cur.longitude),
    );
  }
  return cumKm;
}

// ─── Main functions ───────────────────────────────────────────

/**
 * Project a vehicle position onto the polyline.
 *
 * @param vehicleLat      Vehicle latitude
 * @param vehicleLng      Vehicle longitude
 * @param routePoints     Full ROUTE_DATA array
 * @param cumKm           Pre-built cumulative-km array (pass result of buildCumulativeKm)
 * @param onRouteThresholdM  Max perpendicular distance (m) to consider "on route" (default 15 m)
 */
export function projectVehicleOnRoute(
  vehicleLat: number,
  vehicleLng: number,
  routePoints: RoutePoint[],
  cumKm: number[],
  onRouteThresholdM = 15,
): ProjectionResult {
  let best: {
    distKm: number;
    closestLat: number;
    closestLng: number;
    segIdx: number;
    t: number;
  } | null = null;

  for (let i = 0; i < routePoints.length - 1; i++) {
    const a = routePoints[i].coordinates;
    const b = routePoints[i + 1].coordinates;
    const res = projectOnSegment(
      vehicleLat,
      vehicleLng,
      a.latitude,
      a.longitude,
      b.latitude,
      b.longitude,
    );
    if (!best || res.distKm < best.distKm) {
      best = {
        distKm: res.distKm,
        closestLat: res.closestLat,
        closestLng: res.closestLng,
        segIdx: i,
        t: res.t,
      };
    }
  }

  if (!best) throw new Error("routePoints must have at least 2 points");

  // km from segment start to projected point
  const segStartKm = cumKm[best.segIdx];
  const projectionOnSegKm = haversineKm(
    routePoints[best.segIdx].coordinates.latitude,
    routePoints[best.segIdx].coordinates.longitude,
    best.closestLat,
    best.closestLng,
  );
  const projectedKm = segStartKm + projectionOnSegKm;

  return {
    projectedLat: best.closestLat,
    projectedLng: best.closestLng,
    perpendicularDistanceM: best.distKm * 1000,
    isOnRoute: best.distKm * 1000 <= onRouteThresholdM,
    projectedKm,
    segmentIndex: best.segIdx,
  };
}

/**
 * Calculate distance from the vehicle's projected position to every stop.
 *
 * @param projectedKm   Result of projectVehicleOnRoute().projectedKm
 * @param routePoints   Full ROUTE_DATA array
 * @param cumKm         Pre-built cumulative-km array
 * @returns Array of StopDistance, one entry per station point, sorted by distance
 */
export function distancesToAllStops(
  projectedKm: number,
  routePoints: RoutePoint[],
  cumKm: number[],
): StopDistance[] {
  const AT_THRESHOLD_M = 10; // metres — treat as "at stop"

  const results: StopDistance[] = routePoints
    .filter((p) => p.station)
    .map((stop) => {
      const stopIdx = routePoints.indexOf(stop);
      const stopKm = cumKm[stopIdx];
      const distKm = stopKm - projectedKm; // signed
      const distM = distKm * 1000;

      let direction: StopDistance["direction"];
      if (Math.abs(distM) <= AT_THRESHOLD_M) direction = "at";
      else if (distKm > 0) direction = "ahead";
      else direction = "behind";

      return { stop, distanceKm: distKm, distanceM: distM, direction };
    });

  // Sort by absolute distance — nearest first
  results.sort((a, b) => Math.abs(a.distanceM) - Math.abs(b.distanceM));
  return results;
}

/**
 * Convenience: single call that returns projection + stop distances together.
 *
 * @example
 * const cumKm = buildCumulativeKm(ROUTE_DATA);
 * const result = getVehicleRouteInfo(21.5415, 83.8903, ROUTE_DATA, cumKm);
 * console.log(result.projection.projectedKm);   // km along route
 * console.log(result.stopDistances[0].stop.name); // nearest stop
 * console.log(result.stopDistances[0].distanceM); // metres to it
 */
export function getVehicleRouteInfo(
  vehicleLat: number,
  vehicleLng: number,
  routePoints: RoutePoint[],
  cumKm: number[],
  onRouteThresholdM = 15,
): {
  projection: ProjectionResult;
  stopDistances: StopDistance[];
  nearestStop: StopDistance;
} {
  const projection = projectVehicleOnRoute(
    vehicleLat,
    vehicleLng,
    routePoints,
    cumKm,
    onRouteThresholdM,
  );
  const stopDistances = distancesToAllStops(
    projection.projectedKm,
    routePoints,
    cumKm,
  );
  return { projection, stopDistances, nearestStop: stopDistances[0] };
}

/**
 * Total distance covered by vehicle along the route
 * from its projected position back to the start (index 0).
 */
export function getDistanceCovered(
  vehicleLat: number,
  vehicleLng: number,
  routePoints: RoutePoint[],
  cumKm: number[],
): number {
  const projection = projectVehicleOnRoute(
    vehicleLat,
    vehicleLng,
    routePoints,
    cumKm,
  );
  return projection.projectedKm; // km from route start to vehicle's projected position
}
