import { forwardRef, memo, useMemo } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import type { LatLngTuple, Map as LeafletMap } from "leaflet";
import { Box } from "@mui/material";

import type {
  RoutePoint,
  StopStatus,
  VehicleLiveStructuredStats,
  VehicleRecord,
} from "./types";
import { DEFAULT_CENTER, DEFAULT_ZOOM } from "./constants";
import RouteLayers from "./RouteLayers";
import StopMarkers from "./StopMarkers";
import AlertMarkers from "./AlertMarkers";
import VehicleMarker from "./VehicleMarker";
import MapController from "./MapController";
import { resolveOverlaps, type CollidablePoint } from "./declutter";
import { getLocLatLng } from "./utils";

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

const odishaBounds: L.LatLngBoundsExpression = [
  [17.0, 80.0], // Southwest
  [23.5, 88.5], // Northeast
];

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
    // O(1) lookups instead of vehicleList.find(...) inside a .map() loop
    // (which was O(n*m) every render, and every render triggered by a poll
    // tick, since vehicleList changes reference on every liveStd refetch).
    const vehicleById = useMemo(() => {
      const map = new Map<string | number, VehicleRecord>();
      for (const v of vehicleList) map.set(v.id, v);
      return map;
    }, [vehicleList]);

    const selectedVehicle = selectedVehicleId
      ? vehicleById.get(selectedVehicleId)
      : undefined;
    const alerts =
      selectedVehicle?.device?.structuredTrackingData?.alerts?.list || [];

    // Vehicle markers and alert markers are managed by separate components,
    // but they can legitimately share a real-world coordinate (an alert
    // fired at the vehicle's current spot), which without this would just
    // stack and hide one marker under the other. Resolve overlaps across
    // BOTH sets together so a vehicle+alert pair (or two nearby vehicles)
    // gets fanned out into a small visible cluster instead.
    const resolvedPositions = useMemo(() => {
      const points: CollidablePoint[] = [];

      for (const loc of allVehicleLocs) {
        const [lat, lng] = getLocLatLng(loc);
        points.push({ id: `vehicle-${loc.id}`, lat, lng });
      }
      for (const alert of alerts) {
        points.push({
          id: `alert-${alert.ts}-${alert.evt}`,
          lat: alert.locs.lat,
          lng: alert.locs.lng,
        });
      }

      return resolveOverlaps(points);
    }, [allVehicleLocs, alerts]);

    return (
      <Box sx={{ flex: 1, position: "relative" }}>
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          maxZoom={18}
          minZoom={8}
          bounds={odishaBounds}
          maxBounds={odishaBounds}
          maxBoundsViscosity={1}
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

          {/* Only re-renders when fullPath/trail change, not on other-vehicle ticks */}
          <RouteLayers fullPath={fullPath} trail={trail} />

          {/* Only re-renders when stops/stopStatuses change */}
          <StopMarkers stops={stops} stopStatuses={stopStatuses} />

          {/* Only re-renders when the selected vehicle's alerts change */}
          <AlertMarkers
            alerts={alerts}
            selectedVehicle={selectedVehicle}
            resolvedPositions={resolvedPositions}
          />

          {/* Each marker independently re-renders only if its OWN display
              position (own movement, or a declutter nudge) changed */}
          {allVehicleLocs.map((loc) => {
            const vehicleData = vehicleById.get(loc.id);
            if (!vehicleData) return null;

            const resolved = resolvedPositions.get(`vehicle-${loc.id}`);
            const truePosition = getLocLatLng(loc);
            const displayPosition = resolved?.position ?? truePosition;
            const isOffset = resolved?.isOffset ?? false;

            return (
              <VehicleMarker
                key={`vehicle-${loc.id}`}
                loc={loc}
                vehicleData={vehicleData}
                isSelected={loc.id === selectedVehicleId}
                onSelectVehicle={onSelectVehicle}
                displayPosition={displayPosition}
                truePosition={truePosition}
                isOffset={isOffset}
              />
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

// Wrapping in memo means TrackingMap itself won't re-render if the parent
// page re-renders for a reason unrelated to map props (e.g. a sidebar-only
// state change), on top of the internal sub-component memoization above.
export default memo(TrackingMap);
