import type { LatLngTuple } from "leaflet";

export interface CollidablePoint {
  id: string;
  lat: number;
  lng: number;
}

export interface ResolvedPosition {
  position: LatLngTuple;
  isOffset: boolean;
  truePosition: LatLngTuple;
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

  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(Math.min(1, h)));
}

export function resolveOverlaps(
  points: CollidablePoint[],
  {
    thresholdMeters = 10,
    radiusMeters = 20,
  }: {
    thresholdMeters?: number;
    radiusMeters?: number;
  } = {},
): Map<string, ResolvedPosition> {
  const result = new Map<string, ResolvedPosition>();

  const used = new Array(points.length).fill(false);

  for (let i = 0; i < points.length; i++) {
    if (used[i]) continue;

    // Build the cluster transitively.
    const clusterIdx: number[] = [i];
    used[i] = true;

    for (let c = 0; c < clusterIdx.length; c++) {
      const currentIdx = clusterIdx[c];
      const current = points[currentIdx];

      for (let j = 0; j < points.length; j++) {
        if (used[j]) continue;

        const candidate = points[j];

        if (
          haversineMeters(
            current.lat,
            current.lng,
            candidate.lat,
            candidate.lng,
          ) <= thresholdMeters
        ) {
          clusterIdx.push(j);
          used[j] = true;
        }
      }
    }

    // No overlap.
    if (clusterIdx.length === 1) {
      const p = points[i];

      result.set(p.id, {
        position: [p.lat, p.lng],
        isOffset: false,
        truePosition: [p.lat, p.lng],
      });

      continue;
    }

    // Calculate centroid.
    const centroidLat =
      clusterIdx.reduce((sum, idx) => sum + points[idx].lat, 0) /
      clusterIdx.length;

    const centroidLng =
      clusterIdx.reduce((sum, idx) => sum + points[idx].lng, 0) /
      clusterIdx.length;

    const count = clusterIdx.length;

    clusterIdx.forEach((idx, k) => {
      // Evenly distribute markers around a circle.
      const angle = (2 * Math.PI * k) / count;

      const dLat = metersToLatDegrees(radiusMeters) * Math.sin(angle);

      const dLng =
        metersToLngDegrees(radiusMeters, centroidLat) * Math.cos(angle);

      const p = points[idx];

      result.set(p.id, {
        position: [centroidLat + dLat, centroidLng + dLng],
        isOffset: true,
        truePosition: [p.lat, p.lng],
      });
    });
  }

  return result;
}
