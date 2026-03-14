import React, { useEffect, useRef, useState, useMemo } from "react";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";

import L, { type LatLngTuple } from "leaflet";

import { useParams } from "react-router-dom";
import { useGetOne, useGetList, useNotify } from "react-admin";

import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  LinearProgress,
  Typography,
  TextField,
  Autocomplete,
  Button,
  FormControlLabel,
  Switch,
} from "@mui/material";

import logo from "../assets/logo.png";
import {
  buildCumulativeKm,
  getDistanceCovered,
} from "../components/routeProjection";

// ─── Leaflet icon fix ────────────────────────────────────────────────────────
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)
  ._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ─── Types ───────────────────────────────────────────────────────────────────
interface Coordinates {
  latitude: number;
  longitude: number;
  altitude: number;
}

interface RoutePoint {
  id?: string | number;
  index: number;
  name: string;
  desc: string;
  station: boolean;
  coordinates: Coordinates;
  segment_km?: number;
  cumulative_km?: number;
}

interface LiveLocsRecord {
  timestamp: number;
  lat: number;
  lng: number;
  alt: number;
}

interface LiveStructuredRecord {
  locs: LiveLocsRecord;
}

interface LiveLocationRecord {
  id: string | number;
  structured: LiveStructuredRecord;
  routeIndex?: number;
}

interface VehicleRecord {
  id: string | number;
  registrationNumber: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const POLL_INTERVAL_MS = 10000;
const MAX_TRAIL_POINTS = 500;
const DEFAULT_CENTER: LatLngTuple = [21.5300211, 83.858938]; // India fallback
const DEFAULT_ZOOM = 10;
const SELECTED_ZOOM = 10;

// ─── Icons ───────────────────────────────────────────────────────────────────
const makeStopIcon = (label: string, color: string) =>
  L.divIcon({
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `<div style="
      width:28px;height:28px;border-radius:50%;
      background:${color};border:3px solid #fff;
      box-shadow:0 0 10px ${color}99,0 2px 6px #0006;
      display:flex;align-items:center;justify-content:center;
      font-size:10px;font-weight:800;color:#111;font-family:monospace;
    ">${label}</div>`,
  });

/**
 * Bus marker icon.
 * selected=true  → larger, pulsing purple ring
 * selected=false → smaller, plain white ring
 */
const makeVehicleIcon = (selected: boolean) =>
  L.divIcon({
    className: "",
    iconSize: [selected ? 36 : 28, selected ? 36 : 28],
    iconAnchor: [selected ? 18 : 14, selected ? 18 : 14],
    html: `
    <div style="
      border: ${selected ? "2px solid #7E59E8" : "1px solid white"};
      width:${selected ? 36 : 28}px;
      height:${selected ? 36 : 28}px;
      border-radius:50%;
      overflow:hidden;
      animation:${selected ? "vPulse 1.4s ease-in-out infinite" : "none"};
    ">
      <img src=${logo} alt="Bus" style="width:100%;height:100%;" />
    </div>
    <style>
      @keyframes vPulse {
        0%,100%{box-shadow:0 0 0 8px #45317b48,0 0 16px #44307C}
        50%{box-shadow:0 0 0 16px #6a4ac032,0 0 24px #7552d4}
      }
    </style>`,
  });

// ─── Map controller (pan to follow selected vehicle) ─────────────────────────
interface MapControllerProps {
  lat: number;
  lng: number;
  follow: boolean;
}
const MapController: React.FC<MapControllerProps> = ({ lat, lng, follow }) => {
  const map = useMap();
  useEffect(() => {
    if (follow) map.panTo([lat, lng], { animate: true, duration: 0.6 });
  }, [lat, lng, follow, map]);
  return null;
};

// ─── Stop list item ───────────────────────────────────────────────────────────
interface StopItemProps {
  stop: RoutePoint;
  index: number;
  status: "passed" | "current" | "upcoming";
  isFirst: boolean;
  isLast: boolean;
  cummulativeDistance: number;
  nextStopLen: number;
  maxStopLen: number;
  vehicleProjection: number;
  onClick: () => void;
}

const StopItem: React.FC<StopItemProps> = ({
  stop,
  index,
  status,
  isFirst,
  isLast,
  cummulativeDistance,
  nextStopLen,
  maxStopLen,
  vehicleProjection,
  onClick,
}) => {
  const stopColor =
    status === "passed"
      ? "#44307c"
      : status === "current"
        ? "#44307c"
        : "white";
  const stopBorderColor = status === "passed" ? "white" : "#7E59E8";

  const scale = Math.round(200 / Math.max(maxStopLen, 0.001));
  const nextStopLenInPx = Math.round(nextStopLen * scale);
  const cummulativeLenInPx = Math.round(cummulativeDistance * scale);
  const vehicleProjectionInPx = Math.round(vehicleProjection * scale);
  const remainKmtoStop = Math.max(
    cummulativeDistance + nextStopLen - vehicleProjection,
    0,
  );
  const progressVisible =
    vehicleProjectionInPx > cummulativeLenInPx && remainKmtoStop > 0;

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "1fr 3fr 1fr",
        gap: 1,
        height: `${nextStopLenInPx}px`,
      }}
    >
      <Box />
      <Box
        onClick={onClick}
        sx={{
          display: "flex",
          gap: 1.5,
          cursor: "pointer",
          bgcolor: "#fff",
          position: "relative",
          minHeight: 100,
        }}
      >
        {/* Track background */}
        {!isLast && (
          <Box
            sx={{
              position: "absolute",
              left: "8px",
              top: 0,
              bottom: 0,
              width: "4px",
              bgcolor: "#7E59E8",
            }}
          />
        )}
        {/* Track covered */}
        {!isLast && (
          <Box
            sx={{
              position: "absolute",
              left: "8px",
              top: 0,
              height: `${vehicleProjectionInPx - cummulativeLenInPx}px`,
              width: "4px",
              bgcolor: "#44307c",
            }}
          />
        )}
        {/* Bracket */}
        {!isLast && vehicleProjectionInPx > cummulativeLenInPx && (
          <Box
            sx={{
              position: "absolute",
              left: "-8px",
              top: 0,
              height: `${vehicleProjectionInPx - cummulativeLenInPx}px`,
              width: "8px",
              border: "1px solid #44307c",
              borderRight: "none",
            }}
          />
        )}

        {/* Stop dot */}
        {isFirst || isLast ? (
          <Box sx={{ flexShrink: 0, zIndex: 1, position: "relative" }}>
            <Box
              sx={{
                width: 20,
                height: 20,
                bgcolor: stopColor,
                border: `2px solid ${stopBorderColor}`,
                transition: "all 0.3s",
                rotate: "45deg",
              }}
            />
            {status !== "upcoming" && (
              <Box
                sx={{
                  position: "absolute",
                  left: "5px",
                  top: "2px",
                  color: "white",
                  fontSize: 12,
                }}
              >
                ✔
              </Box>
            )}
          </Box>
        ) : (
          <Box sx={{ flexShrink: 0, zIndex: 1, position: "relative" }}>
            <Box
              sx={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                bgcolor: stopColor,
                border: `2px solid ${stopBorderColor}`,
                transition: "all 0.3s",
              }}
            />
            {status !== "upcoming" && (
              <Box
                sx={{
                  position: "absolute",
                  left: "5px",
                  top: "2px",
                  color: "white",
                  fontSize: 12,
                }}
              >
                ✔
              </Box>
            )}
          </Box>
        )}

        {/* Labels */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="caption"
            sx={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.1em",
              display: "block",
            }}
          >
            S-{index + 1} (
            {cummulativeDistance < 1
              ? (cummulativeDistance * 1000).toFixed(0) + " m"
              : cummulativeDistance.toFixed(2) + " km"}
            )
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontSize: 11,
              fontWeight: 800,
              lineHeight: 1.45,
              wordBreak: "break-word",
              mt: 0.25,
            }}
          >
            {stop.name || `Station ${index + 1}`}
          </Typography>
          {progressVisible && (
            <>
              <Typography
                variant="body2"
                sx={{ fontSize: 11, lineHeight: 1.45, mt: 0.25 }}
              >
                Travelled{" "}
                {vehicleProjection < 1
                  ? (vehicleProjection * 1000).toFixed(0) + " m"
                  : vehicleProjection.toFixed(2) + " km"}
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontSize: 11, lineHeight: 1.45, mt: 0.25 }}
              >
                Next Stop{" "}
                {remainKmtoStop < 1
                  ? (remainKmtoStop * 1000).toFixed(0) + " m"
                  : remainKmtoStop.toFixed(2) + " km"}
              </Typography>
            </>
          )}
        </Box>
      </Box>
      <Box />
    </Box>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const LiveTracking: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const notify = useNotify();
  const mapRef = useRef<L.Map | null>(null);

  const [follow, setFollow] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState<
    string | number | null
  >(id ?? null);

  // Trail only for the currently selected vehicle
  const [trail, setTrail] = useState<LatLngTuple[]>([]);
  const lastKeyRef = useRef<string | null>(null);
  const lastStopRef = useRef(-1);

  // ── 1. Vehicle list for the dropdown ─────────────────────────────────────
  // GET /totalVehicles → [{ id, registrationNumber }]
  const { data: vehicleList, isLoading: vehiclesLoading } =
    useGetList<VehicleRecord>("totalVehicles", {
      pagination: { page: 1, perPage: 100 },
      sort: { field: "registrationNumber", order: "ASC" },
    });

  // ── 2. ALL live data (all bus markers on map) ────────────────────────
  // GET /live → [{ id, structured }]
  const { data: allLocations, refetch: refetchAllLocations } =
    useGetList<LiveLocationRecord>("live", {
      pagination: { page: 1, perPage: 500 },
      sort: { field: "id", order: "ASC" },
    });

  // ── 3. Selected vehicle — dedicated single-record poll ────────────────────
  // GET /live/:id → { id, structured }
  const { data: selectedLocation, refetch: refetchSelectedLocation } =
    useGetOne<LiveLocationRecord>(
      "live",
      { id: selectedVehicleId ?? "" },
      { enabled: !!selectedVehicleId },
    );

  // ── 4. Route for selected vehicle only ───────────────────────────────────
  // GET /routes/:vehicleId → { id, points: RoutePoint[] }
  const {
    data: routeData,
    isLoading: routeLoading,
    error: routeError,
  } = useGetOne<{ id: string | number; points: RoutePoint[] }>(
    "routes",
    { id: selectedVehicleId ?? "" },
    { enabled: !!selectedVehicleId },
  );

  // ── Poll all locations ────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      refetchAllLocations().catch(() => {});
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refetchAllLocations]);

  // ── Poll selected vehicle location ───────────────────────────────────────
  useEffect(() => {
    if (!selectedVehicleId) return;
    const interval = setInterval(() => {
      refetchSelectedLocation().catch(() => {});
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [selectedVehicleId, refetchSelectedLocation]);

  // ── Derived route data ────────────────────────────────────────────────────
  const ROUTE_DATA = useMemo(() => routeData?.points ?? [], [routeData]);
  const STOPS = useMemo(
    () => ROUTE_DATA.filter((p) => p.station),
    [ROUTE_DATA],
  );
  const LONGEST_STOP = useMemo(
    () =>
      STOPS.length > 0
        ? STOPS.reduce((a, b) =>
            (b.segment_km ?? 0) > (a.segment_km ?? 0) ? b : a,
          )
        : null,
    [STOPS],
  );
  const FULL_PATH: LatLngTuple[] = useMemo(
    () =>
      ROUTE_DATA.map((p) => [p.coordinates.latitude, p.coordinates.longitude]),
    [ROUTE_DATA],
  );

  // ── Active location for selected vehicle ─────────────────────────────────
  // Prefer the dedicated single-record poll; fall back to entry in the list.
  const selectedInList = useMemo(
    () => (allLocations ?? []).find((l) => l.id === selectedVehicleId) ?? null,
    [allLocations, selectedVehicleId],
  );
  const activeLoc: LiveLocationRecord | null = selectedVehicleId
    ? (selectedLocation ?? selectedInList)
    : null;

  const displayLat = activeLoc?.structured?.locs?.lat ?? 0;
  const displayLng = activeLoc?.structured?.locs?.lng ?? 0;
  const currentRouteIndex = activeLoc?.routeIndex ?? 0;

  // ── Trail accumulation ────────────────────────────────────────────────────
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

    const arrivedIdx = STOPS.findIndex((s) => s.index === currentRouteIndex);
    if (arrivedIdx !== -1 && arrivedIdx !== lastStopRef.current) {
      lastStopRef.current = arrivedIdx;
      notify(
        `Arrived at Stop ${arrivedIdx + 1}: ${STOPS[arrivedIdx].name || "Station"}`,
        { type: "info" },
      );
    }
  }, [displayLat, displayLng, currentRouteIndex, STOPS, activeLoc, notify]);

  // ── Reset trail when vehicle changes ─────────────────────────────────────
  useEffect(() => {
    setTrail([]);
    lastKeyRef.current = null;
    lastStopRef.current = -1;
  }, [selectedVehicleId]);

  // ── Stop statuses ─────────────────────────────────────────────────────────
  const stopStatuses = useMemo(
    () =>
      STOPS.map((s) =>
        s.index < currentRouteIndex
          ? "passed"
          : s.index === currentRouteIndex
            ? "current"
            : "upcoming",
      ) as Array<"passed" | "current" | "upcoming">,
    [STOPS, currentRouteIndex],
  );

  const cumKm = useMemo(() => buildCumulativeKm(ROUTE_DATA), [ROUTE_DATA]);

  const projectionKm = useMemo(() => {
    if (!activeLoc || ROUTE_DATA.length === 0) return 0;
    return getDistanceCovered(displayLat, displayLng, ROUTE_DATA, cumKm);
  }, [activeLoc, displayLat, displayLng, ROUTE_DATA, cumKm]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const flyToStop = (stop: RoutePoint) => {
    mapRef.current?.flyTo(
      [stop.coordinates.latitude, stop.coordinates.longitude],
      18,
      { duration: 1 },
    );
  };

  /**
   * Select a vehicle by id.
   * Also flies the map to that vehicle's current known position (if available).
   */
  const handleSelectVehicle = (vehicleId: string | number | null) => {
    setSelectedVehicleId(vehicleId);
    if (!vehicleId) return;
    const loc = (allLocations ?? []).find((l) => l.id === vehicleId);
    if (loc) {
      mapRef.current?.flyTo(
        [loc?.structured?.locs?.lat, loc?.structured?.locs?.lng],
        SELECTED_ZOOM,
        {
          duration: 1.2,
        },
      );
    }
  };

  // ── Dropdown options ──────────────────────────────────────────────────────
  const vehicleOptions = useMemo(
    () =>
      (vehicleList ?? []).map((v) => ({
        label: v.registrationNumber,
        id: v.id,
      })),
    [vehicleList],
  );

  const isRouteLoading =
    !!selectedVehicleId && routeLoading && ROUTE_DATA.length === 0;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Card sx={{ height: "100vh", overflow: "hidden" }}>
      <CardContent
        sx={{ display: "flex", flexDirection: "column", height: "100%", p: 2 }}
      >
        {/* ── Header ── */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={1}
        >
          <Typography variant="h5">Live Vehicle Tracking</Typography>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <FormControlLabel
              control={
                <Switch
                  checked={follow}
                  onChange={() => setFollow((x) => !x)}
                  disabled={!activeLoc}
                />
              }
              label="Follow vehicle"
            />
            <Button
              variant="outlined"
              disabled={!activeLoc}
              onClick={() =>
                activeLoc &&
                mapRef.current?.flyTo(
                  [
                    activeLoc?.structured?.locs?.lat,
                    activeLoc?.structured?.locs?.lng,
                  ],
                  mapRef.current.getZoom(),
                  { animate: true },
                )
              }
            >
              Center Map
            </Button>
          </Box>
        </Box>

        <Divider sx={{ mb: 1 }} />

        {/* ── Body ── */}
        <Box sx={{ flex: 1, display: "flex", gap: 2, overflow: "hidden" }}>
          {/* ── Sidebar ── */}
          <Box
            sx={{
              width: 400,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Vehicle selector */}
            <Autocomplete
              options={vehicleOptions}
              loading={vehiclesLoading}
              value={
                vehicleOptions.find((v) => v.id === selectedVehicleId) ?? null
              }
              onChange={(_, val) => handleSelectVehicle(val?.id ?? null)}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Vehicle"
                  size="small"
                  placeholder={vehiclesLoading ? "Loading vehicles…" : ""}
                />
              )}
            />

            {/* Empty state */}
            {!selectedVehicleId && (
              <Box
                sx={{
                  mt: 4,
                  textAlign: "center",
                  color: "text.secondary",
                  px: 2,
                }}
              >
                <Typography variant="h6">No Vehicle Selected</Typography>
                <Typography variant="body2" mt={0.5}>
                  Select a vehicle from the list above or click any bus on the
                  map to see its route and live progress.
                </Typography>
              </Box>
            )}

            {/* Route loading spinner */}
            {isRouteLoading && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress />
                <Typography mt={1} variant="body2" color="text.secondary">
                  Loading route data…
                </Typography>
              </Box>
            )}

            {/* Route error */}
            {routeError && selectedVehicleId && !routeLoading && (
              <Typography color="error" mt={2} variant="body2">
                Could not load route for this vehicle.
              </Typography>
            )}

            {/* Speed / heading chips */}
            {/* {activeLoc && (
              <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
                {activeLoc.speed !== undefined && (
                  <Chip
                    label={`🚌 ${activeLoc.speed.toFixed(1)} km/h`}
                    size="small"
                  />
                )}
                {activeLoc.heading !== undefined && (
                  <Chip
                    label={`🧭 ${activeLoc.heading.toFixed(0)}°`}
                    size="small"
                  />
                )}
              </Box>
            )} */}

            {/* Stop list */}
            {!isRouteLoading && STOPS.length > 0 && (
              <Box sx={{ flex: 1, overflowY: "auto", mt: 1 }}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 3fr 1fr",
                    gap: 1,
                    pt: 1,
                    mb: 1,
                  }}
                >
                  <Typography variant="caption">Arrival</Typography>
                  <Typography variant="caption">Stop / Station</Typography>
                  <Typography variant="caption">Departure</Typography>
                </Box>

                {STOPS.map((stop, i) => (
                  <StopItem
                    key={stop.index}
                    stop={stop}
                    index={i}
                    status={stopStatuses[i]}
                    isFirst={i === 0}
                    isLast={i === STOPS.length - 1}
                    cummulativeDistance={stop.cumulative_km ?? 0}
                    nextStopLen={
                      i === STOPS.length - 1
                        ? 0
                        : (STOPS[i + 1].segment_km ?? 0)
                    }
                    maxStopLen={LONGEST_STOP?.segment_km ?? 1}
                    vehicleProjection={projectionKm}
                    onClick={() => flyToStop(stop)}
                  />
                ))}
              </Box>
            )}
          </Box>

          {/* ── Map ── */}
          <Box sx={{ flex: 1, position: "relative" }}>
            <MapContainer
              center={DEFAULT_CENTER}
              zoom={DEFAULT_ZOOM}
              style={{ height: "100%", width: "100%", minHeight: 600 }}
              ref={mapRef}
            >
              {/* Satellite base */}
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution="Tiles © Esri"
                maxZoom={18}
              />
              {/* Label overlay */}
              <TileLayer
                url="https://mt1.google.com/vt/lyrs=h&x={x}&y={y}&z={z}"
                attribution="Google"
                maxZoom={18}
              />

              {/* ── SELECTED VEHICLE ONLY: planned route ── */}
              {FULL_PATH.length > 1 && (
                <Polyline
                  positions={FULL_PATH}
                  pathOptions={{ color: "#fff", weight: 3, dashArray: "7,6" }}
                />
              )}

              {/* ── SELECTED VEHICLE ONLY: travelled trail ── */}
              {trail.length > 1 && (
                <>
                  <Polyline
                    positions={trail}
                    pathOptions={{ color: "white", weight: 5, opacity: 1 }}
                  />
                  <Polyline
                    positions={trail}
                    pathOptions={{ color: "#44307C", weight: 4, opacity: 1 }}
                  />
                </>
              )}

              {/* ── SELECTED VEHICLE ONLY: stop markers ── */}
              {STOPS.map((stop, i) => {
                const color =
                  stopStatuses[i] === "passed"
                    ? "#a8ff3e"
                    : stopStatuses[i] === "current"
                      ? "#00e5ff"
                      : "#ffcd00";
                return (
                  <Marker
                    key={`stop-${stop.index}`}
                    position={[
                      stop.coordinates.latitude,
                      stop.coordinates.longitude,
                    ]}
                    icon={makeStopIcon(String(i + 1), color)}
                  >
                    <Popup>
                      <Box sx={{ minWidth: 160 }}>
                        <Typography
                          sx={{
                            fontWeight: 700,
                            color: "#8167e8",
                            fontSize: 13,
                          }}
                        >
                          Stop {i + 1}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: 15,
                            color: "#8167e8",
                            fontWeight: 600,
                            lineHeight: 1.4,
                            mt: 0.5,
                          }}
                        >
                          {stop.name || `Station ${i + 1}`}
                        </Typography>
                        <Chip
                          label="● STATION"
                          size="small"
                          sx={{
                            mt: 1,
                            height: 18,
                            fontSize: 9,
                            bgcolor: "rgba(93,0,255,0.12)",
                            color: "#6e2ed5",
                            border: "1px solid rgba(72,0,255,0.3)",
                          }}
                        />
                      </Box>
                    </Popup>
                  </Marker>
                );
              })}

              {/* ── ALL VEHICLES: bus markers (always on map) ── */}
              {(allLocations ?? []).map((loc) => {
                // const isSelected = loc.id === selectedVehicleId;
                const isSelected = true;
                return (
                  <Marker
                    key={`vehicle-${loc.id}`}
                    position={[
                      loc?.structured?.locs?.lat,
                      loc?.structured?.locs?.lng,
                    ]}
                    icon={makeVehicleIcon(isSelected)}
                    zIndexOffset={isSelected ? 1000 : 0}
                    eventHandlers={{
                      // Clicking any bus marker selects that vehicle
                      click: () => handleSelectVehicle(loc.id),
                    }}
                  >
                    {/* <Popup>
                      <Box sx={{ minWidth: 150 }}>
                        <Typography
                          sx={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: "#8167e8",
                          }}
                        >
                          {loc.label ?? `Vehicle ${loc.id}`}
                        </Typography>
                        {loc.speed !== undefined && (
                          <Typography sx={{ fontSize: 12, mt: 0.5 }}>
                            Speed: {loc.speed.toFixed(1)} km/h
                          </Typography>
                        )}
                        {loc.heading !== undefined && (
                          <Typography sx={{ fontSize: 12 }}>
                            Heading: {loc.heading.toFixed(0)}°
                          </Typography>
                        )}
                        {!isSelected && (
                          <Button
                            size="small"
                            variant="contained"
                            sx={{ mt: 1, fontSize: 11 }}
                            onClick={() => handleSelectVehicle(loc.id)}
                          >
                            Track this vehicle
                          </Button>
                        )}
                        {isSelected && (
                          <Chip
                            label="● TRACKING"
                            size="small"
                            sx={{
                              mt: 1,
                              height: 18,
                              fontSize: 9,
                              bgcolor: "rgba(68,48,124,0.12)",
                              color: "#44307c",
                              border: "1px solid rgba(68,48,124,0.3)",
                            }}
                          />
                        )}
                      </Box>
                    </Popup> */}
                  </Marker>
                );
              })}

              {/* Follow the selected vehicle */}
              {activeLoc && (
                <MapController
                  lat={displayLat}
                  lng={displayLng}
                  follow={follow}
                />
              )}
            </MapContainer>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default LiveTracking;
