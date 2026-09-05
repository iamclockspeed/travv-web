import { forwardRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import type { LatLngTuple, Map as LeafletMap } from "leaflet";
import { Box, Button, Chip, Typography } from "@mui/material";

import type {
  RoutePoint,
  StopStatus,
  VehicleLiveStructuredStats,
  VehicleRecord,
} from "./types";
import { DEFAULT_CENTER, DEFAULT_ZOOM, STOP_COLORS } from "./constants";
import { makeStopIcon, makeVehicleIcon } from "./mapIcons";
import { getLocLatLng } from "./utils";
import MapController from "./MapController";

interface TrackingMapProps {
  fullPath: LatLngTuple[];
  trail: LatLngTuple[];
  stops: RoutePoint[];
  stopStatuses: StopStatus[];
  allVehicleLocs: VehicleLiveStructuredStats[];
  vehicleList: VehicleRecord[];
  selectedVehicleId: string | number | null;
  onSelectVehicle: (vehicleId: string | number | null) => void;
  activeLoc: VehicleLiveStructuredStats | null;
  displayLat: number;
  displayLng: number;
  follow: boolean;
}

const TrackingMap = forwardRef<LeafletMap, TrackingMapProps>(
  (
    {
      fullPath,
      trail,
      stops,
      stopStatuses,
      allVehicleLocs,
      vehicleList,
      selectedVehicleId,
      onSelectVehicle,
      activeLoc,
      displayLat,
      displayLng,
      follow,
    },
    mapRef,
  ) => {
    return (
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
          {fullPath.length > 1 && (
            <Polyline
              positions={fullPath}
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
          {stops.map((stop, i) => (
            <Marker
              key={`stop-${stop.index}`}
              position={[stop.coordinates.latitude, stop.coordinates.longitude]}
              icon={makeStopIcon(String(i + 1), STOP_COLORS[stopStatuses[i]])}
            >
              <Popup>
                <Box sx={{ minWidth: 160 }}>
                  <Typography
                    sx={{ fontWeight: 700, color: "#8167e8", fontSize: 13 }}
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
          ))}

          {/* ── ALL VEHICLES: bus markers (always on map) ── */}
          {allVehicleLocs.map((loc) => {
            const isSelected = loc.id === selectedVehicleId;
            const vehicleData = vehicleList.find((v) => v.id === loc.id);
            return (
              <Marker
                key={`vehicle-${loc.id}`}
                position={getLocLatLng(loc)}
                icon={makeVehicleIcon(isSelected)}
                zIndexOffset={isSelected ? 1000 : 0}
              >
                <Popup>
                  <Box sx={{ minWidth: 150 }}>
                    {vehicleData && (
                      <Typography>{vehicleData.registrationNumber}</Typography>
                    )}

                    {!isSelected && (
                      <Button
                        size="small"
                        variant="contained"
                        sx={{ mt: 1, fontSize: 11 }}
                        onClick={() => onSelectVehicle(loc.id)}
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
                </Popup>
              </Marker>
            );
          })}

          {/* Follow the selected vehicle */}
          {activeLoc && (
            <MapController lat={displayLat} lng={displayLng} follow={follow} />
          )}
        </MapContainer>
      </Box>
    );
  },
);

TrackingMap.displayName = "TrackingMap";

export default TrackingMap;
