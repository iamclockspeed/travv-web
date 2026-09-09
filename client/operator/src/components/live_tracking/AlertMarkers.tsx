import { Fragment, memo } from "react";
import { Marker, Polyline, Popup } from "react-leaflet";
import type { LatLngTuple } from "leaflet";
import { Box, Typography } from "@mui/material";

import { ALERT_MAP } from "../vehicles_list/constants";
import { getAlertIcon } from "./iconCache";
import type { ResolvedPosition } from "./declutter";
import type { VehicleRecord } from "./types";

interface AlertItem {
  ts: string | number;
  message: string;
  type: string;
  evt: number | string;
  locs: { lat: number; lng: number; alt: number };
}

interface AlertMarkersProps {
  alerts: AlertItem[];
  selectedVehicle: VehicleRecord | undefined;
  /** Keyed by `alert-${ts}`, same ids used below — resolved by the overlap
   * declutterer in TrackingMap so an alert sitting on top of the vehicle
   * marker (or another alert) gets nudged apart instead of hidden. */
  resolvedPositions: Map<string, ResolvedPosition>;
}

function AlertMarkersImpl({
  alerts,
  selectedVehicle,
  resolvedPositions,
}: AlertMarkersProps) {
  return (
    <>
      {alerts.map((alert) => {
        const id = `alert-${alert.ts}-${alert.evt}`;
        const resolved = resolvedPositions.get(id);
        // Fall back to the raw coordinates if the resolver hasn't run yet
        // for this id (shouldn't normally happen once wired up in TrackingMap).
        const displayPosition: LatLngTuple = resolved?.position ?? [
          alert.locs.lat,
          alert.locs.lng,
        ];
        const truePosition: LatLngTuple = resolved?.truePosition ?? [
          alert.locs.lat,
          alert.locs.lng,
        ];
        const isOffset = resolved?.isOffset ?? false;

        return (
          <Fragment key={id}>
            {isOffset && (
              <Polyline
                positions={[truePosition, displayPosition]}
                pathOptions={{ color: "#888", weight: 1, dashArray: "2,4" }}
              />
            )}
            <Marker
              position={displayPosition}
              icon={getAlertIcon(alert.message)}
              title={alert.message}
            >
              <Popup>
                <Box
                  sx={{
                    minWidth: 260,
                    maxWidth: 300,
                    borderRadius: 2,
                    backgroundColor: "#fff",
                  }}
                >
                  {(() => {
                    const alertType = alert.message?.toLowerCase();
                    const alertConfig = ALERT_MAP[alertType] ?? {
                      icon: "⚠️",
                      color: "#8167e8",
                    };

                    return (
                      <>
                        <Typography
                          sx={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: "#999",
                            textTransform: "uppercase",
                            letterSpacing: 0.8,
                            lineHeight: 1.2,
                          }}
                        >
                          Vehicle Alert{" "}
                          {selectedVehicle &&
                            "(" + selectedVehicle.registrationNumber + ")"}
                        </Typography>

                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Box
                              sx={{
                                width: 34,
                                height: 34,
                                borderRadius: "10px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: `${alertConfig.color}15`,
                                border: `1px solid ${alertConfig.color}30`,
                                fontSize: 17,
                              }}
                            >
                              {alertConfig.icon}
                            </Box>

                            <Box>
                              <Typography
                                sx={{
                                  fontSize: 13,
                                  fontWeight: 700,
                                  color: alertConfig.color,
                                  textTransform: "capitalize",
                                  lineHeight: 1.4,
                                }}
                              >
                                {alert.type}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>

                        <Typography
                          sx={{
                            fontSize: 15,
                            fontWeight: 700,
                            color: "#222",
                            lineHeight: 1.4,
                          }}
                        >
                          {alert.message}
                        </Typography>

                        <Box sx={{ borderTop: "1px solid #eee" }}>
                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: "72px 1fr",
                            }}
                          >
                            <Typography sx={{ fontSize: 11, color: "#999" }}>
                              Time
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: "#444",
                              }}
                            >
                              {new Date(alert.ts).toLocaleString()}
                            </Typography>

                            <Typography sx={{ fontSize: 11, color: "#999" }}>
                              Latitude
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: "#444",
                              }}
                            >
                              {alert.locs.lat}
                            </Typography>

                            <Typography sx={{ fontSize: 11, color: "#999" }}>
                              Longitude
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: "#444",
                              }}
                            >
                              {alert.locs.lng}
                            </Typography>

                            <Typography sx={{ fontSize: 11, color: "#999" }}>
                              Altitude
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: "#444",
                              }}
                            >
                              {alert.locs.alt} m
                            </Typography>
                          </Box>
                        </Box>

                        {isOffset && (
                          <Typography
                            sx={{
                              mt: 1,
                              fontSize: 10,
                              color: "#999",
                              fontStyle: "italic",
                            }}
                          >
                            Marker nudged slightly — overlapped another marker
                            at this location.
                          </Typography>
                        )}
                      </>
                    );
                  })()}
                </Box>
              </Popup>
            </Marker>
          </Fragment>
        );
      })}
    </>
  );
}

// alerts only change when the selected vehicle's alert list changes, not on
// every liveStd poll tick for other vehicles.
export default memo(AlertMarkersImpl);
