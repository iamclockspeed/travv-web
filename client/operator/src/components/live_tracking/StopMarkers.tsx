import { memo } from "react";
import { Marker, Popup } from "react-leaflet";
import { Box, Chip, Typography } from "@mui/material";

import type { RoutePoint, StopStatus } from "./types";
import { STOP_COLORS } from "./constants";
import { getStopIcon } from "./iconCache";
import { formatKm } from "./utils";

interface StopMarkersProps {
  stops: RoutePoint[];
  stopStatuses: StopStatus[];
}

function StopMarkersImpl({ stops, stopStatuses }: StopMarkersProps) {
  return (
    <>
      {stops.map((stop, i) => (
        <Marker
          key={`stop-${stop.index}`}
          position={[stop.coordinates.latitude, stop.coordinates.longitude]}
          icon={getStopIcon(String(i + 1), STOP_COLORS[stopStatuses[i]])}
          title={stop.name || `Station ${i + 1}`}
        >
          <Popup>
            <Box sx={{ minWidth: 160 }}>
              <Typography
                sx={{ fontWeight: 700, color: "#8167e8", fontSize: 13 }}
              >
                Stop {i + 1}
              </Typography>
              <Typography
                sx={{ fontSize: 12, color: "#8167e8", fontWeight: 600 }}
              >
                This Stop: {formatKm(stop.cumulative_km ?? 0)}
                <br />
                {stop.name}
              </Typography>
              <Typography sx={{ color: "#766e95", fontSize: 12 }}>
                Next Stop:
                {formatKm(
                  i === stops.length - 1 ? 0 : (stops[i + 1].segment_km ?? 0),
                )}
                <br />
                {i === stops.length - 1 ? "No Next Stop" : stops[i + 1].name}
              </Typography>
              <Chip
                label={
                  "● " +
                  stopStatuses[i].charAt(0).toUpperCase() +
                  stopStatuses[i].slice(1)
                }
                size="small"
                sx={{
                  mt: 1,
                  height: 18,
                  fontSize: 9,
                  bgcolor: STOP_COLORS[stopStatuses[i]],
                  color: "#000000",
                  border: "1px solid #828282",
                }}
              />
            </Box>
          </Popup>
        </Marker>
      ))}
    </>
  );
}

// stops/stopStatuses only change when the route loads or the vehicle passes
// a stop — not on every liveStd poll tick.
export default memo(StopMarkersImpl);
