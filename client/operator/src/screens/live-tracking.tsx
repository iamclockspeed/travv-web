import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControlLabel,
  IconButton,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Stack,
  Switch,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import SpeedIcon from "@mui/icons-material/Speed";
import SearchIcon from "@mui/icons-material/Search";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

// ---------------- Types ----------------
interface LatLng {
  lat: number;
  lng: number;
}

interface Stop {
  name: string;
  distanceKm: number; // distance from route start in km
  arrival?: string | null;
  departure?: string | null;
  subStops?: Stop[]; // optional nested sub stops
}

interface Vehicle {
  id: string;
  name: string;
  driver?: string;
  color: string;
  // route polyline
  route: LatLng[];
  // runtime
  distanceAlongRouteM: number;
  speedMps: number; // meters per second
  position: LatLng;
  heading: number;
  stops: Stop[]; // copy of base stops for per-vehicle arrival/departure tracking
  lastUpdated?: string;
  status?: "Running" | "Stopped" | "Idle";
  isFinished?: boolean;
}

// ---------------- Helpers ----------------
const toRad = (deg: number) => (deg * Math.PI) / 180;
const earthRadiusM = 6371000;

function haversineMeters(a: LatLng, b: LatLng) {
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h =
    sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  return 2 * earthRadiusM * Math.asin(Math.sqrt(h));
}

function interpolate(a: LatLng, b: LatLng, t: number): LatLng {
  return {
    lat: a.lat + (b.lat - a.lat) * t,
    lng: a.lng + (b.lng - a.lng) * t,
  };
}

function headingDeg(from: LatLng, to: LatLng) {
  const dy = to.lat - from.lat;
  const dx = to.lng - from.lng;
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

const vehicleIcon = (angle: number, color: string) =>
  L.divIcon({
    className: "",
    html: `<div style="transform: rotate(${angle}deg); font-size: 20px;"><span style="display:inline-block;background:${color};border-radius:50%;padding:4px;">🚐</span></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

const labelIcon = (text: string, small = false) =>
  L.divIcon({
    className: "",
    html: `<div style="font-size:${
      small ? 11 : 12
    }px; white-space:nowrap; padding:3px 6px; background:rgba(255,255,255,0.95); border-radius:4px; box-shadow:0 1px 2px rgba(0,0,0,0.12);">${text}</div>`,
    iconAnchor: [12, -8],
  });

function computeRouteDistances(route: LatLng[]) {
  const segLengths: number[] = [];
  const cum: number[] = [0];
  for (let i = 0; i < route.length - 1; i++) {
    const len = haversineMeters(route[i], route[i + 1]);
    segLengths.push(len);
    cum.push(cum[cum.length - 1] + len);
  }
  const total = cum[cum.length - 1];
  return { segLengths, cum, total };
}

function positionFromDistance(
  route: LatLng[],
  segLengths: number[],
  cum: number[],
  distanceM: number
) {
  if (distanceM <= 0) return route[0];
  if (distanceM >= cum[cum.length - 1]) return route[route.length - 1];
  let segIndex = 0;
  while (segIndex < segLengths.length && cum[segIndex + 1] < distanceM)
    segIndex++;
  const segStart = route[segIndex];
  const segEnd = route[segIndex + 1];
  const segStartCum = cum[segIndex];
  const local = (distanceM - segStartCum) / segLengths[segIndex];
  return interpolate(segStart, segEnd, local);
}

function formatSeconds(secs: number) {
  if (!isFinite(secs)) return "--";
  const s = Math.max(0, Math.round(secs));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  if (hh > 0) return `${hh}h ${mm}m`;
  return `${mm}m ${ss}s`;
}

function etaFromSeconds(secondsFromNow: number) {
  if (!isFinite(secondsFromNow)) return "--";
  const eta = new Date(Date.now() + secondsFromNow * 1000);
  return eta.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Map follower helper
const MapFollower: React.FC<{ center?: LatLng | null; follow: boolean }> = ({
  center,
  follow,
}) => {
  const map = useMap();
  useEffect(() => {
    if (follow && center) {
      map.flyTo([center.lat, center.lng], map.getZoom(), { duration: 0.5 });
    }
  }, [center, follow, map]);
  return null;
};

// ---------------- Static route + stops (example) ----------------
const baseRoute: LatLng[] = [
  { lat: 21.47, lng: 83.98 },
  { lat: 21.465, lng: 83.974 },
  { lat: 21.46, lng: 83.965 },
  { lat: 21.455, lng: 83.955 },
  { lat: 21.448, lng: 83.945 },
  { lat: 21.44, lng: 83.935 },
  { lat: 21.433, lng: 83.925 },
  { lat: 21.42, lng: 83.915 },
];

const baseStops: Stop[] = [
  {
    name: "Sambalpur",
    distanceKm: 0,
    subStops: [
      { name: "Sambalpur Gate", distanceKm: 0.8 },
      { name: "Sambalpur Market", distanceKm: 1.6 },
    ],
  },
  {
    name: "Bareipali",
    distanceKm: 4,
    subStops: [{ name: "Bareipali Crossing", distanceKm: 4.6 }],
  },
  {
    name: "Goshala",
    distanceKm: 10,
    subStops: [
      { name: "Goshala East", distanceKm: 10.5 },
      { name: "Goshala West", distanceKm: 10.9 },
    ],
  },
  { name: "Godbhaga", distanceKm: 17 },
  { name: "Attabira", distanceKm: 24 },
  { name: "Bargarh", distanceKm: 34 },
];

// ---------------- Main component ----------------
type Props = {
  onViewVehicleDetails?: (v: Vehicle) => void;
};

const VehicleRouteSimulator: React.FC<Props> = ({ onViewVehicleDetails }) => {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));

  const { segLengths, cum, total } = computeRouteDistances(baseRoute);

  // create demo vehicles
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    const makeV = (
      id: string,
      name: string,
      color: string,
      startFrac: number,
      kmh: number
    ): Vehicle => {
      const startM = total * startFrac;
      const pos = positionFromDistance(baseRoute, segLengths, cum, startM);
      return {
        id,
        name,
        driver: id === "v1" ? "A. Kumar" : id === "v2" ? "R. Das" : "S. Singh",
        color,
        route: baseRoute,
        distanceAlongRouteM: startM,
        speedMps: kmh / 3.6,
        position: pos,
        heading: headingDeg(
          pos,
          positionFromDistance(
            baseRoute,
            segLengths,
            cum,
            Math.min(total, startM + 1)
          )
        ),
        stops: JSON.parse(JSON.stringify(baseStops)),
        lastUpdated: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        status: "Running",
        isFinished: false,
      };
    };
    return [
      makeV("v1", "Bus 101", "#1976d2", 0.0, 24),
      makeV("v2", "Bus 202", "#d32f2f", 0.18, 40),
      makeV("v3", "Truck 7", "#2e7d32", 0.45, 24),
    ];
  });

  const [selectedId, setSelectedId] = useState<string | null>(
    vehicles[0]?.id ?? null
  );
  const [follow, setFollow] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedStops, setExpandedStops] = useState<Record<number, boolean>>(
    {}
  ); // main stop index -> expanded

  // animation refs
  const lastTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  // advance vehicles using requestAnimationFrame (smooth)
  const animate = useCallback(
    (time: number) => {
      if (lastTimeRef.current == null) lastTimeRef.current = time;
      const dtMs = time - lastTimeRef.current;
      lastTimeRef.current = time;
      const dt = dtMs / 1000;

      setVehicles((prev) =>
        prev.map((v) => {
          if (v.isFinished) return v;
          const newDistance = v.distanceAlongRouteM + v.speedMps * dt;

          if (newDistance >= total) {
            const final = v.route[v.route.length - 1];
            return {
              ...v,
              distanceAlongRouteM: total,
              position: final,
              heading: v.heading,
              isFinished: true,
              lastUpdated: new Date().toLocaleTimeString(),
              status: "Stopped",
            };
          }

          const pos = positionFromDistance(
            v.route,
            segLengths,
            cum,
            newDistance
          );
          const nextPos = positionFromDistance(
            v.route,
            segLengths,
            cum,
            Math.min(total, newDistance + 1)
          );
          const hd = headingDeg(pos, nextPos);

          // update stops & sub-stops arrival times when crossing threshold
          const updatedStops = v.stops.map((s) => {
            const sCopy: Stop = {
              ...s,
              subStops: s.subStops
                ? s.subStops.map((ss) => ({ ...ss }))
                : undefined,
            };
            const threshold = 200; // meters proximity
            const mainStopM = s.distanceKm * 1000;
            // main stop arrival
            if (
              !sCopy.arrival &&
              v.distanceAlongRouteM < mainStopM - threshold &&
              newDistance >= mainStopM - threshold
            ) {
              sCopy.arrival = new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });
            }
            // sub-stops
            if (sCopy.subStops && sCopy.subStops.length) {
              sCopy.subStops = sCopy.subStops.map((ss) => {
                const ssCopy = { ...ss };
                const ssM = ss.distanceKm * 1000;
                if (
                  !ssCopy.arrival &&
                  v.distanceAlongRouteM < ssM - threshold &&
                  newDistance >= ssM - threshold
                ) {
                  ssCopy.arrival = new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                }
                return ssCopy;
              });
            }
            return sCopy;
          });

          return {
            ...v,
            distanceAlongRouteM: newDistance,
            position: pos,
            heading: hd,
            stops: updatedStops,
            lastUpdated: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }),
            status: "Running",
          };
        })
      );

      rafRef.current = requestAnimationFrame(animate);
    },
    [cum, segLengths, total]
  );

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = null;
    };
  }, [animate]);

  // helpers for rendering metrics
  const remainingMeters = (v: Vehicle) =>
    Math.max(0, total - v.distanceAlongRouteM);
  const computeMetrics = (v: Vehicle) => {
    const leftM = remainingMeters(v);
    const leftKm = (leftM / 1000).toFixed(2);
    const etaSeconds = v.speedMps > 0 ? leftM / v.speedMps : Infinity;
    const etaAt = isFinite(etaSeconds) ? etaFromSeconds(etaSeconds) : "--";
    return { leftKm, etaAt, etaSeconds };
  };

  const filteredVehicles = vehicles.filter((v) =>
    v.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // compute positions for main stops + sub-stops for map markers
  const stopsPositions = baseStops.map((s) => {
    const pos = positionFromDistance(
      baseRoute,
      segLengths,
      cum,
      Math.min(s.distanceKm * 1000, total)
    );
    const subPos = s.subStops?.map((ss) => ({
      stop: ss,
      pos: positionFromDistance(
        baseRoute,
        segLengths,
        cum,
        Math.min(ss.distanceKm * 1000, total)
      ),
    }));
    return { stop: s, pos, subPos };
  });

  const selectedVehicle = vehicles.find((v) => v.id === selectedId) ?? null;

  // get index of latest main stop reached
  const currentStopIndexOf = (v: Vehicle) => {
    let idx = 0;
    for (let i = 0; i < v.stops.length; i++) {
      if (v.stops[i].distanceKm * 1000 <= v.distanceAlongRouteM) idx = i;
      else break;
    }
    return idx;
  };

  // expand toggle
  const toggleExpand = (index: number) =>
    setExpandedStops((prev) => ({ ...prev, [index]: !prev[index] }));

  // onViewVehicleDetails default
  const defaultViewHandler = (v: Vehicle) => {
    // placeholder — user should pass their own handler to navigate or show modal
    console.log("View vehicle details for:", v.id);
  };

  // map follow center
  const followCenter = selectedVehicle ? selectedVehicle.position : null;

  return (
    <Card sx={{ height: "100%", minHeight: 480 }}>
      <CardContent>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={1}
        >
          <Typography variant="h5">Vehicle Route Simulator</Typography>
          <Box display="flex" alignItems="center" gap={1}>
            <FormControlLabel
              control={
                <Switch
                  checked={follow}
                  onChange={() => setFollow((x) => !x)}
                />
              }
              label="Follow vehicle"
            />
            <Button
              size="small"
              variant="outlined"
              onClick={() =>
                setVehicles((prev) =>
                  prev.map((v) => ({
                    ...v,
                    distanceAlongRouteM: 0,
                    position: v.route[0],
                    stops: JSON.parse(JSON.stringify(baseStops)),
                    isFinished: false,
                    lastUpdated: new Date().toLocaleTimeString(),
                    status: "Running",
                  }))
                )
              }
            >
              Reset
            </Button>
          </Box>
        </Box>

        <Divider sx={{ mb: 1 }} />

        <Box display="flex" flexDirection={isSmall ? "column" : "row"} gap={2}>
          {/* Left column: search + list + selected vehicle details */}
          <Box width={isSmall ? "100%" : "28%"} minWidth={260}>
            <TextField
              size="small"
              placeholder="Search vehicle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
              sx={{ mb: 1 }}
              InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1 }} /> }}
            />

            <List dense sx={{ maxHeight: 240, overflowY: "auto" }}>
              {filteredVehicles.map((v) => {
                const metrics = computeMetrics(v);
                const curIdx = currentStopIndexOf(v);
                const next = v.stops[curIdx + 1];
                return (
                  <ListItemButton
                    key={v.id}
                    selected={selectedId === v.id}
                    onClick={() => setSelectedId(v.id)}
                    sx={{ mb: 0.5 }}
                  >
                    <ListItemAvatar>
                      <Badge
                        badgeContent={<SpeedIcon sx={{ fontSize: 12 }} />}
                        overlap="circular"
                      >
                        <Avatar sx={{ bgcolor: v.color }}>
                          <DirectionsCarIcon />
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={v.name}
                      secondary={
                        <>
                          <span style={{ marginRight: 8 }}>
                            Next: {next ? next.name : "End"}
                          </span>
                          <span style={{ marginRight: 8 }}>
                            Left: {metrics.leftKm} km
                          </span>
                          <span>ETA: {metrics.etaAt}</span>
                        </>
                      }
                    />
                  </ListItemButton>
                );
              })}
            </List>

            <Divider sx={{ my: 1 }} />

            {/* Live details for selected vehicle */}
            {selectedVehicle ? (
              <Box sx={{ p: 1 }}>
                <Typography variant="h6">{selectedVehicle.name}</Typography>
                <Typography variant="caption">
                  Driver: {selectedVehicle.driver}
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Stack spacing={0.5}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Status</Typography>
                    <Typography variant="body2">
                      {selectedVehicle.status}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Speed</Typography>
                    <Typography variant="body2">
                      {(selectedVehicle.speedMps * 3.6).toFixed(0)} km/h
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Last updated</Typography>
                    <Typography variant="body2">
                      {selectedVehicle.lastUpdated}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Current location</Typography>
                    <Typography variant="body2">
                      {selectedVehicle.position.lat.toFixed(4)},{" "}
                      {selectedVehicle.position.lng.toFixed(4)}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 0.5 }} />
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Next stop</Typography>
                    <Typography variant="body2">
                      {selectedVehicle.stops[
                        currentStopIndexOf(selectedVehicle) + 1
                      ]?.name ?? "End"}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Distance left</Typography>
                    <Typography variant="body2">
                      {computeMetrics(selectedVehicle).leftKm} km
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">ETA</Typography>
                    <Typography variant="body2">
                      {computeMetrics(selectedVehicle).etaAt}
                    </Typography>
                  </Box>
                </Stack>

                <Box mt={1}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() =>
                      (onViewVehicleDetails ?? defaultViewHandler)(
                        selectedVehicle
                      )
                    }
                  >
                    View Vehicle Details
                  </Button>
                </Box>
              </Box>
            ) : (
              <Typography variant="body2" sx={{ p: 1 }}>
                Select a vehicle to view live details.
              </Typography>
            )}
          </Box>

          {/* Map & route area */}
          <Box flexGrow={1} minHeight={isSmall ? 360 : 600} position="relative">
            <MapContainer
              center={baseRoute[0]}
              zoom={13}
              style={{ height: isSmall ? 360 : 600, width: "100%" }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

              {/* main route */}
              <Polyline positions={baseRoute} color="#0288d1" weight={4} />

              {/* main stops + sub stops markers */}
              {stopsPositions.map((sp, i) => (
                <React.Fragment key={`mainstop-${i}`}>
                  <Marker
                    position={sp.pos}
                    icon={labelIcon(
                      `${sp.stop.name} (${sp.stop.distanceKm} km)`
                    )}
                  />
                  {sp.subPos?.map((sps, si) => (
                    <Marker
                      key={`sub-${i}-${si}`}
                      position={sps.pos}
                      icon={labelIcon(`${sps.stop.name}`, true)}
                    />
                  ))}
                </React.Fragment>
              ))}

              {/* vehicles */}
              {vehicles.map((v) => (
                <React.Fragment key={v.id}>
                  <Marker
                    position={v.position}
                    icon={vehicleIcon(v.heading, v.color)}
                    eventHandlers={{ click: () => setSelectedId(v.id) }}
                  >
                    <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                      <div style={{ minWidth: 120 }}>
                        <strong>{v.name}</strong>
                        <div style={{ fontSize: 12 }}>
                          {(v.speedMps * 3.6).toFixed(0)} km/h • Left:{" "}
                          {computeMetrics(v).leftKm} km
                        </div>
                      </div>
                    </Tooltip>
                  </Marker>

                  <Polyline
                    positions={v.route}
                    pathOptions={{ color: v.color, weight: 3, opacity: 0.25 }}
                  />
                </React.Fragment>
              ))}

              <MapFollower center={followCenter} follow={follow} />
            </MapContainer>

            {/* Right-top overlay: selected vehicle stops panel with collapsible sub-stops */}
            {selectedVehicle && (
              <Box
                sx={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  zIndex: 1000,
                  backgroundColor: "background.paper",
                  p: 1,
                  borderRadius: 1,
                  boxShadow: 3,
                  width: isSmall ? "calc(100% - 32px)" : 320,
                  maxHeight: isSmall ? 320 : 420,
                  overflowY: "auto",
                }}
              >
                <Typography variant="subtitle1">
                  {selectedVehicle.name}
                </Typography>
                <Typography variant="caption">
                  Speed: {(selectedVehicle.speedMps * 3.6).toFixed(0)} km/h
                </Typography>
                <Divider sx={{ my: 1 }} />

                {selectedVehicle.stops.map((s, idx) => {
                  const isPast = idx < currentStopIndexOf(selectedVehicle);
                  const isCurrent = idx === currentStopIndexOf(selectedVehicle);
                  const expanded = !!expandedStops[idx];
                  return (
                    <Box key={s.name} sx={{ mb: 1 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Box
                            sx={{
                              width: 10,
                              height: 10,
                              borderRadius: "50%",
                              background: isCurrent
                                ? "purple"
                                : isPast
                                ? "gray"
                                : "lightgray",
                            }}
                          />
                          <Box>
                            <Typography
                              variant="body2"
                              fontWeight={isCurrent ? "bold" : "normal"}
                            >
                              {s.name}
                            </Typography>
                            <Typography variant="caption">
                              Arr: {s.arrival ?? "--"} | Dep:{" "}
                              {s.departure ?? "--"} | {s.distanceKm} km
                            </Typography>
                          </Box>
                        </Box>

                        {/* expand toggle only if there are sub-stops */}
                        {s.subStops && s.subStops.length > 0 && (
                          <IconButton
                            size="small"
                            onClick={() => toggleExpand(idx)}
                          >
                            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        )}
                      </Box>

                      {/* sub-stops list (collapsible per main stop) */}
                      {s.subStops && s.subStops.length > 0 && expanded && (
                        <Box sx={{ pl: 4, mt: 0.5 }}>
                          {s.subStops.map((ss) => (
                            <Box
                              key={ss.name}
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                mb: 0.5,
                              }}
                            >
                              <Box
                                sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: "50%",
                                  background: "lightgray",
                                }}
                              />
                              <Box>
                                <Typography
                                  variant="body2"
                                  sx={{ fontSize: 13 }}
                                >
                                  {ss.name}
                                </Typography>
                                <Typography variant="caption">
                                  Arr: {ss.arrival ?? "--"} | {ss.distanceKm} km
                                </Typography>
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default VehicleRouteSimulator;
