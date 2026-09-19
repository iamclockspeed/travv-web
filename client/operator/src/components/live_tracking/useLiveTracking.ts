import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LatLngTuple, Map as LeafletMap } from "leaflet";
import { useGetList, useGetOne, useNotify } from "react-admin";

import type {
  RoutePoint,
  StopStatus,
  VehicleLiveStructuredStats,
  VehicleRecord,
  VehicleRouteResponse,
} from "./types";
import {
  MAX_TRAIL_POINTS,
  POLL_INTERVAL_MS,
  POLL_INTERVAL_MS_SELECTED,
  SELECTED_ZOOM,
} from "./constants";
import { getLocLatLng } from "./utils";
import { buildCumulativeKm, getDistanceCovered } from "./routeProjection";

/**
 * data providers (react-admin/react-query underneath) return a brand-new
 * array — and often brand-new row objects — on every refetch, even when
 * nothing in the payload actually changed. Every consumer downstream
 * (memoized markers, callbacks depending on this list, etc.) then thinks
 * something changed and re-renders.
 *
 * This hook keeps a stable reference to the last list and only returns a
 * new reference when a row was added/removed or a row's own fields
 * (position, status, ignition, moving) actually differ. Individual row
 * objects are also kept stable when unchanged, which is what lets
 * VehicleMarker's memo comparator work.
 */
function useStableList<T extends { id: string | number }>(
  list: T[] | undefined,
  isEqualRow: (a: T, b: T) => boolean,
): T[] {
  const stableRef = useRef<T[]>([]);

  return useMemo(() => {
    const incoming = list ?? [];
    const prev = stableRef.current;

    if (prev.length === incoming.length) {
      let changed = false;
      const merged: T[] = new Array(incoming.length);

      for (let i = 0; i < incoming.length; i++) {
        const prevRow = prev.find((r) => r.id === incoming[i].id);
        if (prevRow && isEqualRow(prevRow, incoming[i])) {
          merged[i] = prevRow; // keep old reference, unchanged
        } else {
          merged[i] = incoming[i]; // new/changed row
          changed = true;
        }
      }

      if (!changed) {
        return prev; // nothing at all changed, return prior array reference
      }
      stableRef.current = merged;
      return merged;
    }

    // length differs (vehicle added/removed) — accept the new list as-is,
    // still reusing unchanged row references where possible
    const merged = incoming.map((row) => {
      const prevRow = prev.find((r) => r.id === row.id);
      return prevRow && isEqualRow(prevRow, row) ? prevRow : row;
    });
    stableRef.current = merged;
    return merged;
  }, [list, isEqualRow]);
}

function isSameVehicleLoc(
  a: VehicleLiveStructuredStats,
  b: VehicleLiveStructuredStats,
): boolean {
  const [aLat, aLng] = getLocLatLng(a);
  const [bLat, bLng] = getLocLatLng(b);
  return aLat === bLat && aLng === bLng;
}

export function useLiveTracking(
  initialVehicleId: string | number | null,
  mapRef: React.RefObject<LeafletMap | null>,
) {
  const notify = useNotify();

  const [follow, setFollow] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState<
    string | number | null
  >(initialVehicleId);

  const [selectedRouteId, setSelectedRouteId] = useState<
    string | number | null
  >(null);

  const [trail, setTrail] = useState<LatLngTuple[]>([]);
  const lastKeyRef = useRef<string | null>(null);
  const lastStopIdxRef = useRef(-1);

  // ── 1. Vehicle list for the dropdown ─────────────────────────────────────
  const { data: vehicleList, isLoading: vehiclesLoading } =
    useGetList<VehicleRecord>("totalVehiclesOverview", {
      pagination: { page: 1, perPage: 100 },
      sort: { field: "registrationNumber", order: "ASC" },
    });

  // ── 2. ALL live data (all bus markers on map) ────────────────────────────
  const { data: allStdRaw, refetch: refetchAllStd } =
    useGetList<VehicleLiveStructuredStats>("liveStd", {
      pagination: { page: 1, perPage: 100 },
      sort: { field: "id", order: "ASC" },
    });

  // Stabilized so unmoved vehicles keep the same object reference across
  // polls — this is what allows VehicleMarker's memo to skip re-rendering.
  const allStd = useStableList(allStdRaw, isSameVehicleLoc);

  // Keep a ref mirror for use inside callbacks that shouldn't churn identity
  // just because the poll ticked (see handleSelectVehicle below).
  const allStdRef = useRef(allStd);
  allStdRef.current = allStd;

  // ── 3. Selected vehicle — dedicated single-record poll ───────────────────
  const { data: selectedStd, refetch: refetchSelectedStd } =
    useGetOne<VehicleLiveStructuredStats>(
      "liveStd",
      { id: selectedVehicleId ?? "" },
      { enabled: !!selectedVehicleId },
    );

  // ── 4. Routes for selected vehicle only ───────────────────────────────────
  const {
    data: routeData,
    isLoading: routeLoading,
    error: routeError,
  } = useGetOne<VehicleRouteResponse>(
    "routes",
    { id: selectedVehicleId ?? "" },
    { enabled: !!selectedVehicleId },
  );

  // ── Poll all std ──────────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      refetchAllStd().catch(() => {});
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refetchAllStd]);

  // ── Poll selected vehicle std ─────────────────────────────────────────────
  useEffect(() => {
    if (!selectedVehicleId) return;
    const interval = setInterval(() => {
      refetchSelectedStd().catch(() => {});
    }, POLL_INTERVAL_MS_SELECTED);
    return () => clearInterval(interval);
  }, [selectedVehicleId, refetchSelectedStd]);

  // ── Derived route data ─────────────────────────────────────────────────────
  const routes = useMemo(() => routeData?.routes ?? [], [routeData]);

  useEffect(() => {
    if (routes.length === 0) {
      setSelectedRouteId(null);
      return;
    }

    setSelectedRouteId((current) => {
      // Keep current route if it still exists
      if (current && routes.some((route) => route.id === current)) {
        return current;
      }

      // Otherwise select first route
      return routes[0].id;
    });
  }, [routes]);

  const selectedRoute = useMemo(
    () => routes.find((route) => route.id === selectedRouteId) ?? null,
    [routes, selectedRouteId],
  );

  const routePoints = useMemo(
    () => selectedRoute?.points ?? [],
    [selectedRoute],
  );
  const stops = useMemo(
    () => routePoints.filter((p) => p.station),
    [routePoints],
  );
  const longestStop = useMemo(
    () =>
      stops.length > 0
        ? stops.reduce((a, b) =>
            (b.segment_km ?? 0) > (a.segment_km ?? 0) ? b : a,
          )
        : null,
    [stops],
  );
  const fullPath: LatLngTuple[] = useMemo(
    () =>
      routePoints.map((p) => [p.coordinates.latitude, p.coordinates.longitude]),
    [routePoints],
  );

  // ── Active location for selected vehicle ──────────────────────────────────
  const selectedInList = useMemo(
    () => allStd.find((l) => l.id === selectedVehicleId) ?? null,
    [allStd, selectedVehicleId],
  );
  const activeLoc: VehicleLiveStructuredStats | null = selectedVehicleId
    ? (selectedStd ?? selectedInList)
    : null;

  const [displayLat, displayLng] = getLocLatLng(activeLoc);

  // ── Distance travelled along the route, in km ─────────────────────────────
  const cumKm = useMemo(() => buildCumulativeKm(routePoints), [routePoints]);

  const projectionKm = useMemo(() => {
    if (!activeLoc || routePoints.length === 0) return 0;
    const dist = getDistanceCovered(displayLat, displayLng, routePoints, cumKm);
    const DIST_PRECISION = 4;
    return parseFloat(dist.toFixed(DIST_PRECISION));
  }, [activeLoc, displayLat, displayLng, routePoints, cumKm]);

  const currentStopArrIdx = useMemo(() => {
    if (!activeLoc || stops.length === 0) return -1;
    let idx = -1;
    for (let i = 0; i < stops.length; i++) {
      if ((stops[i].cumulative_km ?? 0) <= projectionKm) idx = i;
    }
    return idx;
  }, [stops, projectionKm, activeLoc]);

  const stopStatuses = useMemo(
    () =>
      stops.map(
        (_, i): StopStatus =>
          i <= currentStopArrIdx
            ? "passed"
            : i - 1 === currentStopArrIdx
              ? "next"
              : "upcoming",
      ),
    [stops, currentStopArrIdx],
  );

  // ── Trail accumulation + arrival notifications ────────────────────────────
  useEffect(() => {
    if (!activeLoc) return;
    const key = `${displayLat.toFixed(6)},${displayLng.toFixed(6)}`;
    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;

    setTrail((prev) => {
      const next: LatLngTuple[] = [...prev, [displayLat, displayLng]];
      return next.length > MAX_TRAIL_POINTS
        ? next.slice(-MAX_TRAIL_POINTS)
        : next;
    });

    if (
      currentStopArrIdx !== -1 &&
      currentStopArrIdx !== lastStopIdxRef.current
    ) {
      lastStopIdxRef.current = currentStopArrIdx;
      notify(
        `Arrived at Stop ${currentStopArrIdx + 1}: ${stops[currentStopArrIdx].name || "Station"}`,
        { type: "info" },
      );
    }
  }, [displayLat, displayLng, currentStopArrIdx, stops, activeLoc, notify]);

  // ── Reset trail when vehicle changes ──────────────────────────────────────
  useEffect(() => {
    setTrail([]);
    lastKeyRef.current = null;
    lastStopIdxRef.current = -1;
  }, [selectedVehicleId]);

  // ── Map helpers ────────────────────────────────────────────────────────────
  const flyTo = useCallback(
    (position: LatLngTuple, zoom?: number) => {
      mapRef.current?.flyTo(position, zoom ?? mapRef.current.getZoom(), {
        duration: 1,
      });
    },
    [mapRef],
  );

  const flyToStop = useCallback(
    (stop: RoutePoint) =>
      flyTo([stop.coordinates.latitude, stop.coordinates.longitude], 18),
    [flyTo],
  );

  // Reads allStd via ref instead of depending on it directly, so this
  // callback's identity stays stable across every poll tick. Without this,
  // onSelectVehicle passed down to every VehicleMarker changed reference
  // every POLL_INTERVAL_MS, which alone defeated VehicleMarker's memo for
  // ALL vehicles, not just the moving one.
  const handleSelectVehicle = useCallback(
    (vehicleId: string | number | null) => {
      setSelectedVehicleId(vehicleId);
      if (!vehicleId) return;
      const loc = allStdRef.current.find((l) => l.id === vehicleId);
      if (loc) flyTo(getLocLatLng(loc), SELECTED_ZOOM);
    },
    [flyTo],
  );

  const handleCenterMap = useCallback(() => {
    if (activeLoc) flyTo(getLocLatLng(activeLoc));
  }, [activeLoc, flyTo]);

  const isRouteLoading =
    !!selectedVehicleId && routeLoading && routePoints.length === 0;

  return {
    // vehicle list / selection
    vehicleList: vehicleList ?? [],
    vehiclesLoading,
    selectedVehicleId,
    handleSelectVehicle,

    // route + stops
    routes,
    selectedRouteId,
    setSelectedRouteId,
    stops,
    longestStopSegmentKm: longestStop?.segment_km ?? 1,
    fullPath,
    isRouteLoading,
    routeError,
    stopStatuses,
    projectionKm,
    flyToStop,

    // live positions
    allVehicleLocs: allStd,
    activeLoc,
    displayLat,
    displayLng,
    trail,

    // map controls
    follow,
    setFollow,
    handleCenterMap,
  };
}
