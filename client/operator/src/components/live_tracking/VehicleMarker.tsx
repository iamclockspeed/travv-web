import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { Marker, Polyline, Popup } from "react-leaflet";
import type { LatLngTuple } from "leaflet";
import { Box, Button, Chip, Typography } from "@mui/material";

import type { VehicleLiveStructuredStats, VehicleRecord } from "./types";
import { getVehicleIcon } from "./iconCache";

interface VehicleMarkerProps {
  loc: VehicleLiveStructuredStats;
  vehicleData: VehicleRecord;
  isSelected: boolean;
  onSelectVehicle: (vehicleId: string | number) => void;
  /** Where to actually draw the marker — may be nudged off the true GPS
   * point if another marker (another vehicle, or an alert) sits on top of
   * it. See declutter.ts / resolveOverlaps. */
  displayPosition: LatLngTuple;
  /** True GPS position, shown in the popup and used to draw a leader line
   * back from the nudged marker so the offset doesn't read as inaccurate. */
  truePosition: LatLngTuple;
  isOffset: boolean;
}

function VehicleMarkerImpl({
  loc: _loc,
  vehicleData,
  isSelected,
  onSelectVehicle,
  displayPosition,
  truePosition,
  isOffset,
}: VehicleMarkerProps) {
  const vehicleStatus =
    vehicleData.device?.structuredTrackingData?.general?.status ?? "offline";
  const vehicleIgnition =
    vehicleData.device?.structuredTrackingData?.general?.ignition ?? "off";
  const vehicleMoving =
    vehicleData.device?.structuredTrackingData?.general?.moving ?? "stopped";
  const navigate = useNavigate();

  return (
    <>
      {/* Thin leader line so a nudged marker still reads as "this vehicle,
          right here" rather than looking like a positioning error. */}
      {isOffset && (
        <Polyline
          positions={[truePosition, displayPosition]}
          pathOptions={{ color: "#888", weight: 1, dashArray: "2,4" }}
        />
      )}
      <Marker
        position={displayPosition}
        icon={getVehicleIcon(isSelected, vehicleStatus)}
        zIndexOffset={isSelected ? 1000 : 0}
        title={vehicleData.registrationNumber}
      >
        <Popup closeButton={false}>
          <Box
            sx={{
              width: 280,
              overflow: "hidden",
              borderRadius: 2,
              fontFamily: "Roboto, Arial, sans-serif",
            }}
          >
            {/* Vehicle Image */}
            <Box
              sx={{
                width: "100%",
                height: 130,
                bgcolor: "#f4f4f5",
                overflow: "hidden",
              }}
            >
              {vehicleData.images?.length > 0 ? (
                <Box
                  component="img"
                  src={
                    import.meta.env.VITE_BACKEND_HOST +
                    vehicleData.images[0].url
                  }
                  alt={vehicleData.registrationNumber}
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              ) : (
                <Box
                  sx={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#aaa",
                    fontSize: 12,
                  }}
                >
                  No vehicle image
                </Box>
              )}
            </Box>

            <Box>
              {/* Registration + Status */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                }}
              >
                <Typography
                  sx={{ fontSize: 17, fontWeight: 700, color: "#202124" }}
                >
                  {vehicleData.registrationNumber}
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    px: 0.8,
                    borderRadius: 2,
                    bgcolor:
                      vehicleStatus === "active"
                        ? "rgba(46,125,50,0.1)"
                        : "rgba(117,117,117,0.1)",
                  }}
                >
                  <Box
                    sx={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      bgcolor: vehicleStatus === "active" ? "#2e7d32" : "#888",
                    }}
                  />
                  <Typography
                    sx={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: vehicleStatus === "active" ? "#2e7d32" : "#777",
                    }}
                  >
                    {vehicleStatus.toUpperCase()}
                  </Typography>
                </Box>
              </Box>

              <Typography sx={{ fontSize: 11, color: "#777" }}>
                {vehicleData.type}
                {" • "}
                {vehicleData.make}
                {" • "}
                {vehicleData.model}
              </Typography>

              <Box sx={{ display: "flex", gap: 1 }}>
                <Box
                  sx={{
                    flex: 1,
                    px: 1,
                    py: 0.8,
                    bgcolor: "#f7f7f8",
                    borderRadius: 1,
                  }}
                >
                  <Typography sx={{ fontSize: 9, color: "#888" }}>
                    MOVEMENT
                  </Typography>
                  <Typography
                    sx={{
                      mt: 0.2,
                      fontSize: 12,
                      fontWeight: 600,
                      textTransform: "capitalize",
                    }}
                  >
                    {vehicleMoving ?? "Stopped"}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    flex: 1,
                    px: 1,
                    py: 0.8,
                    bgcolor: "#f7f7f8",
                    borderRadius: 1,
                  }}
                >
                  <Typography sx={{ fontSize: 9, color: "#888" }}>
                    IGNITION
                  </Typography>
                  <Typography
                    sx={{
                      mt: 0.2,
                      fontSize: 12,
                      fontWeight: 600,
                      textTransform: "uppercase",
                    }}
                  >
                    {vehicleIgnition ?? "OFF"}
                  </Typography>
                </Box>
              </Box>

              <Button
                fullWidth
                size="small"
                variant="contained"
                onClick={() => {
                  navigate(
                    `/total-vehicles?filter=${encodeURIComponent(
                      JSON.stringify({
                        vehicle: vehicleData.registrationNumber,
                      }),
                    )}`,
                  );
                }}
                sx={{
                  mt: 1.5,
                  height: 36,
                  borderRadius: 1.5,
                  textTransform: "none",
                  fontSize: 12,
                  fontWeight: 600,
                  bgcolor: "#d8d7d8",
                  color: "black",
                  boxShadow: "none",
                  "&:hover": {
                    bgcolor: "#362563",
                    color: "white",
                    boxShadow: "none",
                  },
                }}
              >
                View Full Details
              </Button>

              {!isSelected && (
                <Button
                  fullWidth
                  size="small"
                  variant="contained"
                  onClick={() => onSelectVehicle(vehicleData.id)}
                  sx={{
                    mt: 1.5,
                    height: 36,
                    borderRadius: 1.5,
                    textTransform: "none",
                    fontSize: 12,
                    fontWeight: 600,
                    bgcolor: "#44307c",
                    boxShadow: "none",
                    "&:hover": { bgcolor: "#362563", boxShadow: "none" },
                  }}
                >
                  Track
                </Button>
              )}

              {isSelected && (
                <Chip
                  label="● TRACKING"
                  size="small"
                  sx={{
                    mt: 1.5,
                    height: 24,
                    width: "100%",
                    fontSize: 10,
                    fontWeight: 600,
                    bgcolor: "rgba(68,48,124,0.1)",
                    color: "#44307c",
                    border: "1px solid rgba(68,48,124,0.25)",
                  }}
                />
              )}

              {isOffset && (
                <Typography
                  sx={{
                    mt: 1,
                    fontSize: 10,
                    color: "#999",
                    fontStyle: "italic",
                  }}
                >
                  Marker nudged slightly — overlapped another marker at this
                  stop. True position: {truePosition[0].toFixed(5)},{" "}
                  {truePosition[1].toFixed(5)}
                </Typography>
              )}
            </Box>
          </Box>
        </Popup>
      </Marker>
    </>
  );
}

function areEqual(prev: VehicleMarkerProps, next: VehicleMarkerProps) {
  if (prev.isSelected !== next.isSelected) return false;
  if (prev.vehicleData !== next.vehicleData) return false; // vehicle metadata/status changed
  if (prev.onSelectVehicle !== next.onSelectVehicle) return false;
  if (prev.isOffset !== next.isOffset) return false;

  // Only re-render THIS marker if the position it actually draws at changed
  // — either its own coordinates moved, or the overlap resolver nudged it
  // because a neighboring marker's cluster changed. This is the single most
  // important guard: without it, every marker re-renders on every poll tick
  // because allVehicleLocs is a new array each time, even though 99% of
  // vehicles didn't move.
  return (
    prev.displayPosition[0] === next.displayPosition[0] &&
    prev.displayPosition[1] === next.displayPosition[1]
  );
}

// Custom comparator instead of default shallow-prop memo() because `loc` is
// a nested object whose top-level reference changes every poll even when
// lat/lng are unchanged (see useStableList in useLiveTracking.ts) — we want
// to compare the coordinates themselves, not object identity.
export default memo(VehicleMarkerImpl, areEqual);
