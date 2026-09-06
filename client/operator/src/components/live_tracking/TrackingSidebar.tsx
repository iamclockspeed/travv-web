import React from "react";
import {
  Box,
  LinearProgress,
  Typography,
  TextField,
  Autocomplete,
} from "@mui/material";

import type { RoutePoint, StopStatus } from "./types";
import StopItem from "./StopItem";

interface VehicleOption {
  label: string;
  id: string | number;
}

interface TrackingSidebarProps {
  vehicleOptions: VehicleOption[];
  vehiclesLoading: boolean;
  selectedVehicleId: string | number | null;
  onSelectVehicle: (vehicleId: string | number | null) => void;

  isRouteLoading: boolean;
  routeError: unknown;

  stops: RoutePoint[];
  stopStatuses: StopStatus[];
  longestStopSegmentKm: number;
  projectionKm: number;
  onStopClick: (stop: RoutePoint) => void;
}

const TrackingSidebar: React.FC<TrackingSidebarProps> = ({
  vehicleOptions,
  vehiclesLoading,
  selectedVehicleId,
  onSelectVehicle,
  isRouteLoading,
  routeError,
  stops,
  stopStatuses,
  longestStopSegmentKm,
  projectionKm,
  onStopClick,
}) => {
  return (
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
        value={vehicleOptions.find((v) => v.id === selectedVehicleId) ?? null}
        onChange={(_, val) => onSelectVehicle(val?.id ?? null)}
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
          sx={{ mt: 4, textAlign: "center", color: "text.secondary", px: 2 }}
        >
          <Typography variant="h6">No Vehicle Selected</Typography>
          <Typography variant="body2" mt={0.5}>
            Select a vehicle from the list above or click any bus on the map to
            see its route and live progress.
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
      {!!routeError && !!selectedVehicleId && !isRouteLoading && (
        <Typography color="error" mt={2} variant="body2">
          Could not load route for this vehicle.
        </Typography>
      )}

      {/* Stop list */}
      {!isRouteLoading && stops.length > 0 && (
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

          {stops.map((stop, i) => (
            <StopItem
              key={stop.index}
              stop={stop}
              index={i}
              status={stopStatuses[i]}
              isFirst={i === 0}
              isLast={i === stops.length - 1}
              cumulativeDistance={stop.cumulative_km ?? 0}
              nextStopLen={
                i === stops.length - 1 ? 0 : (stops[i + 1].segment_km ?? 0)
              }
              maxStopLen={longestStopSegmentKm}
              vehicleProjection={projectionKm}
              onClick={() => onStopClick(stop)}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default TrackingSidebar;
