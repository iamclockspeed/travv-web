// VehicleRouteSimulator.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Tooltip,
  useMap,
} from "react-leaflet";
import {
  Card,
  CardContent,
  Box,
  Typography,
  Divider,
  TextField,
  List,
  ListItem,
  ListItemText,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import L from "leaflet";
import FullscreenIcon from "@mui/icons-material/Fullscreen";

interface LatLng {
  lat: number;
  lng: number;
}

interface Stop {
  name: string;
  arrival: string;
  departure: string;
  distance: number;
}

interface Vehicle {
  id: string;
  name: string;
  route: LatLng[];
  positionIndex: number;
  direction: number;
  stops: Stop[];
}

const vehicleIcon = (angle: number) =>
  L.divIcon({
    className: "",
    html: `<div style="transform: rotate(${angle}deg); font-size: 22px;">🚐</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });

const markerLabel = (text: string, color: string = "black") =>
  L.divIcon({
    html: `<div style="color: ${color}; font-size: 14px;">${text}</div>`,
    className: "",
    iconAnchor: [12, 12],
  });

const calculateHeading = (from: LatLng, to: LatLng): number => {
  const dy = to.lat - from.lat;
  const dx = to.lng - from.lng;
  return (Math.atan2(dy, dx) * 180) / Math.PI;
};

const stops: Stop[] = [
  {
    name: "Sambalpur",
    arrival: "07:15 AM",
    departure: "07:17 AM",
    distance: 0,
  },
  {
    name: "Bareipali",
    arrival: "07:17 AM",
    departure: "07:17 AM",
    distance: 4,
  },
  { name: "Goshala", arrival: "--", departure: "--", distance: 10 },
  { name: "Godbhaga", arrival: "--", departure: "--", distance: 17 },
  { name: "Attabira", arrival: "--", departure: "--", distance: 24 },
  { name: "Bargarh", arrival: "08:35 AM", departure: "--", distance: 34 },
];

const routeCoords: LatLng[] = [
  { lat: 21.47, lng: 83.98 },
  { lat: 21.46, lng: 83.95 },
  { lat: 21.45, lng: 83.93 },
  { lat: 21.44, lng: 83.91 },
  { lat: 21.43, lng: 83.89 },
  { lat: 21.42, lng: 83.87 },
];

const RouteDetailPanel: React.FC<{
  stops: Stop[];
  currentStopIndex: number;
}> = ({ stops, currentStopIndex }) => {
  return (
    <Box sx={{ p: 2, background: "#fff", borderTop: "1px solid #ccc" }}>
      <Typography variant="h6">Live Station Tracking</Typography>
      <Divider sx={{ mb: 2 }} />
      {stops.map((stop, index) => {
        const isPast = index < currentStopIndex;
        const isCurrent = index === currentStopIndex;
        return (
          <Box
            key={index}
            sx={{ display: "flex", alignItems: "center", mb: 1 }}
          >
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: isCurrent
                  ? "purple"
                  : isPast
                  ? "gray"
                  : "lightgray",
                mr: 1,
              }}
            />
            <Box sx={{ flexGrow: 1 }}>
              <Typography
                variant="body1"
                fontWeight={isCurrent ? "bold" : "normal"}
              >
                {stop.name}
              </Typography>
              <Typography variant="caption">
                Arr: {stop.arrival} | Dep: {stop.departure} | {stop.distance} km
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

const VehicleRouteSimulator: React.FC = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [vehicles, setVehicles] = useState<Vehicle[]>([
    {
      id: "v1",
      name: "Vehicle 1",
      route: routeCoords,
      positionIndex: 0,
      direction: calculateHeading(routeCoords[0], routeCoords[1]),
      stops,
    },
  ]);

  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      setVehicles((prev) =>
        prev.map((v) => {
          const nextIndex = Math.min(v.positionIndex + 1, v.route.length - 1);
          const direction =
            nextIndex < v.route.length
              ? calculateHeading(v.route[v.positionIndex], v.route[nextIndex])
              : v.direction;
          return {
            ...v,
            positionIndex: nextIndex,
            direction,
          };
        })
      );
    }, 2000);

    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
  }, []);

  const filteredVehicles = vehicles.filter((v) =>
    v.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card
      sx={{ height: isFullscreen ? "100vh" : "auto", position: "relative" }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">Vehicle Map Tracker</Typography>
          <IconButton onClick={() => setIsFullscreen(!isFullscreen)}>
            <FullscreenIcon />
          </IconButton>
        </Box>

        <Box
          display="flex"
          flexDirection={isSmallScreen ? "column" : "row"}
          gap={2}
        >
          <Box width={isSmallScreen ? "100%" : "25%"}>
            <TextField
              label="Search Vehicle"
              fullWidth
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ mb: 1 }}
            />
            <List>
              {filteredVehicles.map((v) => (
                <ListItem
                  button
                  key={v.id}
                  onClick={() => setSelectedVehicle(v)}
                  selected={selectedVehicle?.id === v.id}
                  component="div"
                >
                  <ListItemText primary={v.name} />
                </ListItem>
              ))}
            </List>
          </Box>

          <Box flexGrow={1} position="relative">
            <MapContainer
              center={routeCoords[0]}
              zoom={13}
              style={{ height: isFullscreen ? "80vh" : "400px" }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {vehicles.map((v) => (
                <React.Fragment key={v.id}>
                  <Polyline positions={v.route} color="blue" weight={4} />
                  {v.route.map((point, i) => (
                    <Marker
                      key={`stop-${i}`}
                      position={point}
                      icon={markerLabel(
                        stops[i]?.name || `Stop ${i + 1}`,
                        "black"
                      )}
                    />
                  ))}
                  <Marker
                    position={v.route[v.positionIndex]}
                    icon={vehicleIcon(v.direction)}
                    eventHandlers={{ click: () => setSelectedVehicle(v) }}
                  >
                    <Tooltip>{v.name}</Tooltip>
                  </Marker>
                </React.Fragment>
              ))}
            </MapContainer>

            {selectedVehicle && (
              <Box
                sx={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  backgroundColor: "#fff",
                  borderRadius: 2,
                  boxShadow: 3,
                  p: 2,
                  zIndex: 1000,
                }}
              >
                <Typography variant="subtitle1">
                  {selectedVehicle.name}
                </Typography>
                <Typography variant="body2">
                  Next Stop:{" "}
                  {selectedVehicle.stops[selectedVehicle.positionIndex + 1]
                    ?.name || "End"}
                </Typography>
                <Typography variant="body2">
                  Distance Left:{" "}
                  {selectedVehicle.stops[selectedVehicle.stops.length - 1]
                    .distance -
                    selectedVehicle.stops[selectedVehicle.positionIndex]
                      .distance}{" "}
                  km
                </Typography>
              </Box>
            )}

            {selectedVehicle && (
              <RouteDetailPanel
                stops={selectedVehicle.stops}
                currentStopIndex={selectedVehicle.positionIndex}
              />
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default VehicleRouteSimulator;
