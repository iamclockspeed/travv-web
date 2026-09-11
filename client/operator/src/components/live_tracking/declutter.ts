import type { LatLngTuple } from "leaflet";

export interface CollidablePoint {
  id: string;
  lat: number;
  lng: number;
}

const EARTH_RADIUS_M = 6371000;

function metersToLatDegrees(m: number): number {
  return (m / EARTH_RADIUS_M) * (180 / Math.PI);
}

function metersToLngDegrees(m: number, atLat: number): number {
  const cosLat = Math.cos((atLat * Math.PI) / 180);

  // Avoid exploding near the poles.
  if (Math.abs(cosLat) < 1e-10) {
    return 0;
  }

  return (m / (EARTH_RADIUS_M * cosLat)) * (180 / Math.PI);
}

function haversineMeters(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;

  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

export interface ResolvedPosition {
  position: LatLngTuple;
  isOffset: boolean;
  truePosition: LatLngTuple;
}

export function resolveOverlaps(
  points: CollidablePoint[],
  {
    thresholdMeters = 10,
    radiusMeters = 10,
  }: {
    thresholdMeters?: number;
    radiusMeters?: number;
  } = {},
): Map<string, ResolvedPosition> {
  const result = new Map<string, ResolvedPosition>();

  if (points.length === 0) {
    return result;
  }

  // Build clusters.
  const clusters: CollidablePoint[][] = [];
  const visited = new Set<string>();

  for (const point of points) {
    if (visited.has(point.id)) {
      continue;
    }

    const cluster: CollidablePoint[] = [point];
    visited.add(point.id);

    let changed = true;

    // Expand the cluster transitively.
    while (changed) {
      changed = false;

      for (const candidate of points) {
        if (visited.has(candidate.id)) {
          continue;
        }

        const isClose = cluster.some((member) => {
          return (
            haversineMeters(
              member.lat,
              member.lng,
              candidate.lat,
              candidate.lng,
            ) <= thresholdMeters
          );
        });

        if (isClose) {
          cluster.push(candidate);
          visited.add(candidate.id);
          changed = true;
        }
      }
    }

    clusters.push(cluster);
  }

  for (const cluster of clusters) {
    // Nothing to resolve.
    if (cluster.length === 1) {
      const p = cluster[0];

      result.set(p.id, {
        position: [p.lat, p.lng],
        truePosition: [p.lat, p.lng],
        isOffset: false,
      });

      continue;
    }

    // Calculate the shared center.
    const centroidLat =
      cluster.reduce((sum, p) => sum + p.lat, 0) / cluster.length;

    const centroidLng =
      cluster.reduce((sum, p) => sum + p.lng, 0) / cluster.length;

    const latOffset = metersToLatDegrees(radiusMeters);
    const lngOffset = metersToLngDegrees(radiusMeters, centroidLat);

    cluster.forEach((p, index) => {
      const angle = (2 * Math.PI * index) / cluster.length;

      const lat = centroidLat + latOffset * Math.sin(angle);
      const lng = centroidLng + lngOffset * Math.cos(angle);

      result.set(p.id, {
        position: [lat, lng],
        truePosition: [p.lat, p.lng],
        isOffset: true,
      });
    });
  }

  return result;
}
