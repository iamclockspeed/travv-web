import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LatLngTuple, Map as LeafletMap } from "leaflet";
import { useGetList, useGetOne, useNotify } from "react-admin";

import type {
  RoutePoint,
  StopStatus,
  VehicleLiveStructuredStats,
  VehicleRecord,
  VehicleRouteProps,
} from "./types";
import { MAX_TRAIL_POINTS, POLL_INTERVAL_MS, SELECTED_ZOOM } from "./constants";
import { getLocLatLng } from "./utils";
import { buildCumulativeKm, getDistanceCovered } from "./routeProjection";

export function useLiveTracking(
  initialVehicleId: string | number | null,
  mapRef: React.RefObject<LeafletMap | null>,
) {
  const notify = useNotify();

  const [follow, setFollow] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState<
    string | number | null
  >(initialVehicleId);

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
  const { data: allStd, refetch: refetchAllStd } =
    useGetList<VehicleLiveStructuredStats>("liveStd", {
      pagination: { page: 1, perPage: 100 },
      sort: { field: "id", order: "ASC" },
    });

  // ── 3. Selected vehicle — dedicated single-record poll ───────────────────
  const { data: selectedStd, refetch: refetchSelectedStd } =
    useGetOne<VehicleLiveStructuredStats>(
      "liveStd",
      { id: selectedVehicleId ?? "" },
      { enabled: !!selectedVehicleId },
    );

  // ── 4. Route for selected vehicle only ───────────────────────────────────
  const {
    data: routeData,
    isLoading: routeLoading,
    error: routeError,
  } = useGetOne<VehicleRouteProps>(
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
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [selectedVehicleId, refetchSelectedStd]);

  // ── Derived route data ─────────────────────────────────────────────────────
  const routePoints = useMemo(() => routeData?.points ?? [], [routeData]);
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
  // Prefer the dedicated single-record poll; fall back to entry in the list.
  const selectedInList = useMemo(
    () => (allStd ?? []).find((l) => l.id === selectedVehicleId) ?? null,
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
    return getDistanceCovered(displayLat, displayLng, routePoints, cumKm);
  }, [activeLoc, displayLat, displayLng, routePoints, cumKm]);

  // ── Which stop (by position in `stops`) the vehicle has most recently
  //     reached, derived from its actual projected distance rather than a
  //     fixed index. -1 means it hasn't reached the first stop yet. ─────────
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
          i < currentStopArrIdx
            ? "passed"
            : i === currentStopArrIdx
              ? "current"
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
        {
          type: "info",
        },
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

  const handleSelectVehicle = useCallback(
    (vehicleId: string | number | null) => {
      setSelectedVehicleId(vehicleId);
      if (!vehicleId) return;
      const loc = (allStd ?? []).find((l) => l.id === vehicleId);
      if (loc) flyTo(getLocLatLng(loc), SELECTED_ZOOM);
    },
    [allStd, flyTo],
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
    stops,
    longestStopSegmentKm: longestStop?.segment_km ?? 1,
    fullPath,
    isRouteLoading,
    routeError,
    stopStatuses,
    projectionKm,
    flyToStop,

    // live positions
    allVehicleLocs: allStd ?? [],
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
