import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";

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
import { useGetOne, useNotify } from "react-admin";
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
import route_map_img from "../assets/route-maps.png";

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
  index: number;
  name: string;
  desc: string;
  station: boolean;
  coordinates: Coordinates;
  segment_km?: number;
  cumulative_km?: number;
}

interface LiveLocationRecord {
  id: string | number;
  lat: number;
  lng: number;
  routeIndex?: number;
  speed?: number;
  heading?: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const POLL_INTERVAL_MS = 2000;
const MAX_TRAIL_POINTS = 500;

// Inline route data — replace with an API call / prop as needed
const ROUTE_DATA: RoutePoint[] = [
  {
    index: 0,
    name: "Durgamandir Chowk",
    desc: "",
    station: true,
    coordinates: {
      longitude: 83.8891,
      latitude: 21.54244,
      altitude: 0.0,
    },
    segment_km: 0.0,
    cumulative_km: 0.0,
  },
  {
    index: 1,
    name: "",
    desc: "",
    station: false,
    coordinates: {
      longitude: 83.88962,
      latitude: 21.54245,
      altitude: 0.0,
    },
  },
  {
    index: 2,
    name: "",
    desc: "",
    station: false,
    coordinates: {
      longitude: 83.88971,
      latitude: 21.54243,
      altitude: 0.0,
    },
  },
  {
    index: 3,
    name: "",
    desc: "",
    station: false,
    coordinates: {
      longitude: 83.88978,
      latitude: 21.54242,
      altitude: 0.0,
    },
  },
  {
    index: 4,
    name: "",
    desc: "",
    station: false,
    coordinates: {
      longitude: 83.88979,
      latitude: 21.54242,
      altitude: 0.0,
    },
  },
  {
    index: 5,
    name: "",
    desc: "",
    station: false,
    coordinates: {
      longitude: 83.88986,
      latitude: 21.54237,
      altitude: 0.0,
    },
  },
  {
    index: 6,
    name: "",
    desc: "",
    station: false,
    coordinates: {
      longitude: 83.8902,
      latitude: 21.54207,
      altitude: 0.0,
    },
  },
  {
    index: 7,
    name: "",
    desc: "",
    station: false,
    coordinates: {
      longitude: 83.89046,
      latitude: 21.54182,
      altitude: 0.0,
    },
  },
  {
    index: 8,
    name: "",
    desc: "",
    station: false,
    coordinates: {
      longitude: 83.8905,
      latitude: 21.54177,
      altitude: 0.0,
    },
  },
  {
    index: 9,
    name: "",
    desc: "",
    station: false,
    coordinates: {
      longitude: 83.89051,
      latitude: 21.54175,
      altitude: 0.0,
    },
  },
  {
    index: 10,
    name: "",
    desc: "",
    station: false,
    coordinates: {
      longitude: 83.89054,
      latitude: 21.54171,
      altitude: 0.0,
    },
  },
  {
    index: 11,
    name: "",
    desc: "",
    station: false,
    coordinates: {
      longitude: 83.89055,
      latitude: 21.54167,
      altitude: 0.0,
    },
  },
  {
    index: 12,
    name: "",
    desc: "",
    station: false,
    coordinates: {
      longitude: 83.89055,
      latitude: 21.54164,
      altitude: 0.0,
    },
  },
  {
    index: 13,
    name: "",
    desc: "",
    station: false,
    coordinates: {
      longitude: 83.89055,
      latitude: 21.54162,
      altitude: 0.0,
    },
  },
  {
    index: 14,
    name: "",
    desc: "",
    station: false,
    coordinates: {
      longitude: 83.89053,
      latitude: 21.54154,
      altitude: 0.0,
    },
  },
  {
    index: 15,
    name: "Saktimandir",
    desc: "",
    station: true,
    coordinates: {
      longitude: 83.8905,
      latitude: 21.54149,
      altitude: 0.0,
    },
    segment_km: 0.2084,
    cumulative_km: 0.2084,
  },
  {
    index: 16,
    name: "",
    desc: "",
    station: false,
    coordinates: {
      longitude: 83.89023,
      latitude: 21.541,
      altitude: 0.0,
    },
  },
  {
    index: 17,
    name: "",
    desc: "",
    station: false,
    coordinates: {
      longitude: 83.89014,
      latitude: 21.54084,
      altitude: 0.0,
    },
  },
  {
    index: 18,
    name: "",
    desc: "",
    station: false,
    coordinates: {
      longitude: 83.89005,
      latitude: 21.54068,
      altitude: 0.0,
    },
  },
  {
    index: 19,
    name: "",
    desc: "",
    station: false,
    coordinates: {
      longitude: 83.88987,
      latitude: 21.54036,
      altitude: 0.0,
    },
  },
  {
    index: 20,
    name: "Biharipada",
    desc: "",
    station: true,
    coordinates: {
      longitude: 83.88966,
      latitude: 21.53998,
      altitude: 0.0,
    },
    segment_km: 0.1891,
    cumulative_km: 0.3975,
  },
  {
    index: 21,
    name: "",
    desc: "",
    station: false,
    coordinates: {
      longitude: 83.88961,
      latitude: 21.53989,
      altitude: 0.0,
    },
  },
  {
    index: 22,
    name: "",
    desc: "",
    station: false,
    coordinates: {
      longitude: 83.8896,
      latitude: 21.53988,
      altitude: 0.0,
    },
  },
  {
    index: 23,
    name: "",
    desc: "",
    station: false,
    coordinates: {
      longitude: 83.8896,
      latitude: 21.53982,
      altitude: 0.0,
    },
  },
  {
    index: 24,
    name: "",
    desc: "",
    station: false,
    coordinates: {
      longitude: 83.88961,
      latitude: 21.53979,
      altitude: 0.0,
    },
  },
  {
    index: 25,
    name: "",
    desc: "",
    station: false,
    coordinates: {
      longitude: 83.88963,
      latitude: 21.53975,
      altitude: 0.0,
    },
  },
  {
    index: 26,
    name: "",
    desc: "",
    station: false,
    coordinates: {
      longitude: 83.88965,
      latitude: 21.53973,
      altitude: 0.0,
    },
  },
  {
    index: 27,
    name: "",
    desc: "",
    station: false,
    coordinates: {
      longitude: 83.8897,
      latitude: 21.53969,
      altitude: 0.0,
    },
  },
  {
    index: 28,
    name: "",
    desc: "",
    station: false,
    coordinates: {
      longitude: 83.88972,
      latitude: 21.53968,
      altitude: 0.0,
    },
  },
  {
    index: 29,
    name: "",
    desc: "",
    station: false,
    coordinates: {
      longitude: 83.88975,
      latitude: 21.53967,
      altitude: 0.0,
    },
  },
  {
    index: 30,
    name: "",
    desc: "",
    station: false,
    coordinates: {
      longitude: 83.88985,
      latitude: 21.53965,
      altitude: 0.0,
    },
  },
  {
    index: 31,
    name: "",
    desc: "",
    station: false,
    coordinates: {
      longitude: 83.89005,
      latitude: 21.53962,
      altitude: 0.0,
    },
  },
  {
    index: 32,
    name: "",
    desc: "",
    station: false,
    coordinates: {
      longitude: 83.89102,
      latitude: 21.53952,
      altitude: 0.0,
    },
  },
  {
    index: 33,
    name: "",
    desc: "",
    station: false,
    coordinates: {
      longitude: 83.89125,
      latitude: 21.53949,
      altitude: 0.0,
    },
  },
  {
    index: 34,
    name: "",
    desc: "",
    station: false,
    coordinates: {
      longitude: 83.89219,
      latitude: 21.53939,
      altitude: 0.0,
    },
  },
  {
    index: 35,
    name: "",
    desc: "",
    station: false,
    coordinates: {
      longitude: 83.89272,
      latitude: 21.53933,
      altitude: 0.0,
    },
  },
  {
    index: 36,
    name: "Remed Chowk",
    desc: "",
    station: true,
    coordinates: {
      longitude: 83.89285,
      latitude: 21.53931,
      altitude: 0.0,
    },
    segment_km: 0.3666,
    cumulative_km: 0.764,
  },
];

const STOPS = ROUTE_DATA.filter((p) => p.station);
const LONGEST_STOP = STOPS.reduce((prev, curr) => {
  const prevScore = prev.segment_km ?? 0;
  const currScore = curr.segment_km ?? 0;
  return currScore > prevScore ? curr : prev;
});
const FULL_PATH: LatLngTuple[] = ROUTE_DATA.map((p) => [
  p.coordinates.latitude,
  p.coordinates.longitude,
]);

// ─── Custom marker icons ──────────────────────────────────────────────────────
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

const makeVehicleIcon = () =>
  L.divIcon({
    className: "",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    html: `<div style="
    border: 1px solid white;
      width:30px;height:30px;border-radius:50%; overflow: hidden;
      animation:vPulse 1.4s ease-in-out infinite;
    ">
    <img src=${logo} alt="Logo" style="width:30px;height:"30px;" />
    </div>
    <style>
      @keyframes vPulse {
        0%,100%{box-shadow:0 0 0 8px #45317b48,0 0 16px #44307C}
        50%{box-shadow:0 0 0 16px #6a4ac032,0 0 24px #7552d4}
      }
    </style>`,
  });

// ─── Map controller (pan/fly without remounting) ─────────────────────────────
interface MapControllerProps {
  lat: number;
  lng: number;
  follow: boolean;
}
const MapController: React.FC<MapControllerProps> = ({ lat, lng, follow }) => {
  const map = useMap();
  useEffect(() => {
    if (follow) {
      map.panTo([lat, lng], { animate: true, duration: 0.6 });
    }
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

  const stopBorderColor =
    status === "passed"
      ? "white"
      : status === "current"
        ? "#7E59E8"
        : "#7E59E8";

  const textColor = "text.primary";

  const nextStopLenInPx = Math.round(
    nextStopLen * Math.round(200 / maxStopLen),
  );

  const cummulativeLenInPx = Math.round(
    cummulativeDistance * Math.round(200 / maxStopLen),
  );

  const vehicleProjectionInPx = Math.round(
    vehicleProjection * Math.round(200 / maxStopLen),
  );

  const remainKmtoStop = Math.max(
    cummulativeDistance + nextStopLen - vehicleProjection,
    0,
  );

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "1fr 3fr 1fr",
        gap: 1,
        height: `${nextStopLenInPx}px`,
      }}
    >
      <Box>
        {/* Text */}
        {/* <Box>
          <Typography
            variant="body2"
            sx={{
              color: "#44307c",
              fontSize: 11,
              lineHeight: 1.45,
              wordBreak: "break-word",
              mt: 0.25,
            }}
          >
            07:15 AM
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: textColor,
              fontSize: 11,
              lineHeight: 1.45,
              wordBreak: "break-word",
              mt: 0.25,
            }}
          >
            07:15 AM
          </Typography>
        </Box> */}
      </Box>
      <Box
        onClick={onClick}
        sx={{
          display: "flex",
          gap: 1.5,
          cursor: "pointer",
          bgcolor: "rgb(255, 255, 255)",
          position: "relative",
          minHeight: 100,
        }}
      >
        {/* Connector line Path */}
        {!isLast && (
          <Box
            sx={{
              position: "absolute",
              left: "8px",
              top: "0px",
              bottom: "0px",
              width: "4px",
              bgcolor: "#7E59E8",
            }}
          />
        )}
        {/* Connector line Covered */}
        {!isLast && (
          <Box
            sx={{
              position: "absolute",
              left: "8px",
              top: "0px",
              height: `${vehicleProjectionInPx - cummulativeLenInPx}px`,
              width: "4px",
              bgcolor: "#44307c",
            }}
          />
        )}

        {/* Connector line Covered Distance */}
        {!isLast && (
          <Box
            sx={{
              position: "absolute",
              left: "-8px",
              top: "0px",
              height: `${vehicleProjectionInPx - cummulativeLenInPx}px`,
              width: "8px",
              border:
                vehicleProjectionInPx <= cummulativeLenInPx
                  ? "none"
                  : "1px solid #44307c",
              borderRight: "none",
              bgcolor: "#44307c00",
            }}
          />
        )}

        {/* Dot */}
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
            {(status === "current" || status === "passed") && (
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
          <Box sx={{ flexShrink: 0, zIndex: 1 }}>
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
            {(status === "current" || status === "passed") && (
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

        {/* Text */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="caption"
            sx={{
              color: "text",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.1em",
              display: "block",
            }}
          >
            S-{index + 1} (
            {cummulativeDistance < 1
              ? (cummulativeDistance * 1000).toFixed(0) + " Meter"
              : cummulativeDistance.toFixed(2) + " KM"}
            )
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: textColor,
              fontSize: 11,
              fontWeight: 800,
              lineHeight: 1.45,
              wordBreak: "break-word",
              mt: 0.25,
            }}
          >
            {stop.name || `Station ${index + 1}`}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: textColor,
              fontSize: 11,
              lineHeight: 1.45,
              wordBreak: "break-word",
              mt: 0.25,
              visibility:
                vehicleProjectionInPx <= cummulativeLenInPx
                  ? "hidden"
                  : remainKmtoStop > 0
                    ? "visible"
                    : "hidden",
            }}
          >
            Travelled{" "}
            {vehicleProjection < 1
              ? (vehicleProjection * 1000).toFixed(0) + " Meter"
              : vehicleProjection.toFixed(2) + " KM"}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: textColor,
              fontSize: 11,
              lineHeight: 1.45,
              wordBreak: "break-word",
              mt: 0.25,
              visibility:
                vehicleProjectionInPx <= cummulativeLenInPx
                  ? "hidden"
                  : remainKmtoStop > 0
                    ? "visible"
                    : "hidden",
            }}
          >
            Next Stop{" "}
            {remainKmtoStop < 1
              ? (remainKmtoStop * 1000).toFixed(0) + " Meter"
              : remainKmtoStop.toFixed(2) + " KM"}
          </Typography>
        </Box>
      </Box>
      <Box>
        {/* Text */}
        {/* <Box>
          <Typography
            variant="body2"
            sx={{
              color: "#44307c",
              fontSize: 11,
              lineHeight: 1.45,
              wordBreak: "break-word",
              mt: 0.25,
            }}
          >
            07:15 AM
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: textColor,
              fontSize: 11,
              lineHeight: 1.45,
              wordBreak: "break-word",
              mt: 0.25,
            }}
          >
            07:15 AM
          </Typography>
        </Box> */}
      </Box>
    </Box>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const LiveTracking: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const notify = useNotify();

  // Map instance ref (for imperative control)
  const mapRef = useRef<L.Map | null>(null);

  // UI state
  const [follow, setFollow] = useState(true);
  const [speedMult, setSpeedMult] = useState(1);

  // Live trail (accumulated GPS positions)
  const [trail, setTrail] = useState<LatLngTuple[]>([]);
  const lastKeyRef = useRef<string | null>(null);

  // Simulated playback state (for demo — remove in production)
  const [simIdx, setSimIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const simRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastStopRef = useRef(-1);

  // React Admin data fetch
  const { data, isLoading, error, refetch } = useGetOne<LiveLocationRecord>(
    "locations",
    { id: id ?? "" },
    { enabled: !!id },
  );

  // ── Derived display position ────────────────────────────────────────────────
  // In production: use data.lat / data.lng directly.
  // Here we overlay the simulated position on top of the live fetch for demo.
  const displayPt = ROUTE_DATA[simIdx];
  const displayLat = displayPt.coordinates.latitude;
  const displayLng = displayPt.coordinates.longitude;

  // ── Simulation tick (replace with polling logic in production) ─────────────
  const startSim = useCallback(() => {
    if (simRef.current) clearInterval(simRef.current);
    const ms = Math.max(50, Math.round(900 / speedMult));
    simRef.current = setInterval(() => {
      setSimIdx((prev) => {
        if (prev >= ROUTE_DATA.length - 1) {
          clearInterval(simRef.current!);
          setIsPlaying(false);
          notify("Route complete — vehicle has reached the final stop.", {
            type: "success",
          });
          return prev;
        }
        return prev + 1;
      });
    }, ms);
  }, [speedMult, notify]);

  useEffect(() => {
    if (isPlaying) startSim();
    else if (simRef.current) clearInterval(simRef.current);
    return () => {
      if (simRef.current) clearInterval(simRef.current);
    };
  }, [isPlaying, startSim]);

  // ── Append to trail on position change ────────────────────────────────────
  useEffect(() => {
    const key = `${displayLat.toFixed(6)},${displayLng.toFixed(6)}`;
    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;

    setTrail((prev) => {
      const next: LatLngTuple[] = [...prev, [displayLat, displayLng]];
      return next.length > MAX_TRAIL_POINTS
        ? next.slice(next.length - MAX_TRAIL_POINTS)
        : next;
    });

    // Check if we arrived at a station
    const arrivedIdx = STOPS.findIndex((s) => s.index === simIdx);
    if (arrivedIdx !== -1 && arrivedIdx !== lastStopRef.current) {
      lastStopRef.current = arrivedIdx;
      const stop = STOPS[arrivedIdx];
      notify(`Arrived at Stop ${arrivedIdx + 1}: ${stop.name || "Station"}`, {
        type: "info",
      });
    }
  }, [displayLat, displayLng, simIdx, notify]);

  // ── Real server polling (active in production) ────────────────────────────
  useEffect(() => {
    if (!id) return;
    const interval = setInterval(() => {
      refetch().catch(() => {
        /* handled by react-admin error state */
      });
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [id, refetch]);

  // ── Derived values ─────────────────────────────────────────────────────────
  const vehicleIcon = useMemo(() => makeVehicleIcon(), []);

  const stopStatuses = useMemo(
    () =>
      STOPS.map((s) =>
        s.index < simIdx
          ? "passed"
          : s.index === simIdx
            ? "current"
            : "upcoming",
      ) as Array<"passed" | "current" | "upcoming">,
    [simIdx],
  );

  const nextStop = STOPS.find((s) => s.index > simIdx);
  const nextStopLabel = nextStop
    ? `Stop ${STOPS.indexOf(nextStop) + 1} (${nextStop.index - simIdx} pts)`
    : "Final stop";

  const handleReset = () => {
    if (simRef.current) clearInterval(simRef.current);
    setSimIdx(0);
    setTrail([]);
    lastKeyRef.current = null;
    lastStopRef.current = -1;
    setIsPlaying(true);
    mapRef.current?.flyTo(
      [ROUTE_DATA[0].coordinates.latitude, ROUTE_DATA[0].coordinates.longitude],
      16,
    );
  };

  const handleCenter = () => {
    mapRef.current?.flyTo([displayLat, displayLng], mapRef.current.getZoom(), {
      animate: true,
    });
  };

  const flyToStop = (stop: RoutePoint) => {
    mapRef.current?.flyTo(
      [stop.coordinates.latitude, stop.coordinates.longitude],
      18,
      { duration: 1 },
    );
  };

  // ── Loading / error states ────────────────────────────────────────────────
  if (isLoading && !data && id) {
    return (
      <Card sx={{ m: 2 }}>
        <CardContent>
          <LinearProgress />
          <Typography mt={2} color="text.secondary">
            Loading live location…
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────

  const cumKm = buildCumulativeKm(ROUTE_DATA);
  // const { projection, stopDistances, nearestStop } = getVehicleRouteInfo(
  //   displayLat,
  //   displayLng,
  //   ROUTE_DATA,
  //   cumKm,
  // );

  const vehicleRouteInfo = useMemo(() => {
    return getDistanceCovered(displayLat, displayLng, ROUTE_DATA, cumKm);
  }, [displayLat, displayLng, ROUTE_DATA, cumKm]);

  const projectionKm = vehicleRouteInfo;

  return (
    <Card
      sx={{
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <CardContent
        sx={{ display: "flex", flexDirection: "column", height: "100%" }}
      >
        {/* ── Header ── */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={1}
        >
          <Typography variant="h5">Live Vehicle Tracking</Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={follow}
                  onChange={() => setFollow((x) => !x)}
                />
              }
              label="Follow vehicle"
            />
            <Button variant="contained">Vehicles Near Me</Button>
            <Button variant="outlined">Refresh Map</Button>
          </Box>
        </Box>

        {/* ── Horizontal Divider ── */}
        <Divider sx={{ mb: 1 }} />

        {/* ── BODY ── */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            gap: 2,
            overflow: "hidden",
          }}
        >
          {/* ── SIDEBAR ── */}
          <Box
            sx={{
              width: 400,
            }}
          >
            <Autocomplete
              options={[
                { label: "OD02AB1234", id: 1 },
                { label: "OD02AB5678", id: 2 },
              ]}
              renderInput={(params) => (
                <TextField {...params} label="Select Vehicle" size="small" />
              )}
            />

            <Box
              sx={{
                position: "relative",
                overflowY: "auto",
                height: "100%",
              }}
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 3fr 1fr",
                  gap: 1,
                  pt: 2,
                }}
              >
                <Box>
                  <Typography sx={{ mb: 2 }}>Arrival</Typography>
                </Box>
                <Box>
                  <Typography sx={{ mb: 2 }}>Stop/Station</Typography>
                </Box>
                <Box>
                  <Typography sx={{ mb: 2 }}>Departure</Typography>
                </Box>
              </Box>
              {/* Stop list */}
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
                    i === STOPS.length - 1 ? 0 : (STOPS[i + 1].segment_km ?? 0)
                  }
                  maxStopLen={LONGEST_STOP.segment_km ?? 0}
                  vehicleProjection={projectionKm}
                  onClick={() => flyToStop(stop)}
                />
              ))}
            </Box>

            {/* Empty list */}
            {/* <Box
              sx={{
                mt: 1,
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <img src={route_map_img} alt="Route Map Image" width="200" />
              <Typography variant="h6">No Vehicle Selected</Typography>
              <Typography>
                Select any vehicle to see its route and more details.
              </Typography>
            </Box> */}
          </Box>

          {/* ── MAP ── */}
          <Box sx={{ flex: 1, position: "relative" }}>
            <MapContainer
              center={[displayLat, displayLng]}
              zoom={18}
              style={{ height: "100%", width: "100%", minHeight: 600 }}
            >
              {/* Satellite imagery */}
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution="Tiles © Esri"
                maxZoom={18}
              />

              {/* labels layer */}
              <TileLayer
                url="https://mt1.google.com/vt/lyrs=h&x={x}&y={y}&z={z}"
                attribution="Google"
                maxZoom={18}
              />

              {/* Full planned route */}
              <Polyline
                positions={FULL_PATH}
                pathOptions={{
                  color: "rgb(255, 255, 255)",
                  weight: 3,
                  dashArray: "7,6",
                }}
              />

              {/* Travelled trail */}
              {trail.length > 1 && (
                <>
                  <Polyline
                    positions={trail}
                    pathOptions={{ color: "white", weight: 5, opacity: 1.0 }}
                  />
                  <Polyline
                    positions={trail}
                    pathOptions={{ color: "#44307C", weight: 4, opacity: 1.0 }}
                  />
                </>
              )}

              {/* Station markers */}
              {STOPS.map((stop, i) => {
                const status = stopStatuses[i];
                const color =
                  status === "passed"
                    ? "#a8ff3e"
                    : status === "current"
                      ? "#00e5ff"
                      : "#ffcd00";
                return (
                  <Marker
                    key={stop.index}
                    position={[
                      stop.coordinates.latitude,
                      stop.coordinates.longitude,
                    ]}
                    icon={makeStopIcon(String(i + 1), color)}
                  >
                    <Popup>
                      <Box sx={{ minWidth: 180 }}>
                        <Typography
                          sx={{
                            fontWeight: 700,
                            color: "#8167e8",
                            fontSize: 13,
                            mb: 0.5,
                          }}
                        >
                          Stop {i + 1}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: 16,
                            color: "#8167e8",
                            mb: 0.75,
                            lineHeight: 1.4,
                            fontWeight: 600,
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
                            bgcolor: "rgba(93, 0, 255, 0.12)",
                            color: "#6e2ed5",
                            border: "1px solid rgba(72, 0, 255, 0.3)",
                          }}
                        />
                      </Box>
                    </Popup>
                  </Marker>
                );
              })}

              {/* Vehicle marker */}
              <Marker
                position={[displayLat, displayLng]}
                icon={vehicleIcon}
                zIndexOffset={1000}
              >
                <Popup>
                  <Box>
                    <Typography
                      sx={{
                        fontSize: 16,
                        color: "#8167e8",
                        mb: 0.75,
                        lineHeight: 1.4,
                        fontWeight: 600,
                      }}
                    >
                      Bus
                    </Typography>
                  </Box>
                </Popup>
              </Marker>

              <MapController
                lat={displayLat}
                lng={displayLng}
                follow={follow}
              />
            </MapContainer>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default LiveTracking;
