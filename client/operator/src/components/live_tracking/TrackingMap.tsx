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

// import { forwardRef } from "react";
// import {
//   MapContainer,
//   TileLayer,
//   Marker,
//   Popup,
//   Polyline,
// } from "react-leaflet";
// import type { LatLngTuple, Map as LeafletMap } from "leaflet";
// import { Box, Button, Chip, Typography } from "@mui/material";

// import type {
//   RoutePoint,
//   StopStatus,
//   VehicleLiveStructuredStats,
//   VehicleRecord,
// } from "./types";
// import { DEFAULT_CENTER, DEFAULT_ZOOM, STOP_COLORS } from "./constants";
// import { ALERT_MAP } from "../vehicles_list/constants";
// import { makeAlertIcon, makeStopIcon, makeVehicleIcon } from "./mapIcons";
// import { getLocLatLng, formatKm } from "./utils";
// import MapController from "./MapController";

// interface TrackingMapProps {
//   fullPath: LatLngTuple[];
//   trail: LatLngTuple[];
//   stops: RoutePoint[];
//   stopStatuses: StopStatus[];
//   allVehicleLocs: VehicleLiveStructuredStats[];
//   vehicleList: VehicleRecord[];
//   selectedVehicleId: string | number | null;
//   onSelectVehicle: (vehicleId: string | number | null) => void;
//   activeLoc: VehicleLiveStructuredStats | null;
//   displayLat: number;
//   displayLng: number;
//   follow: boolean;
// }

// const TrackingMap = forwardRef<LeafletMap, TrackingMapProps>(
//   (
//     {
//       fullPath,
//       trail,
//       stops,
//       stopStatuses,
//       allVehicleLocs,
//       vehicleList,
//       selectedVehicleId,
//       onSelectVehicle,
//       activeLoc,
//       displayLat,
//       displayLng,
//       follow,
//     },
//     mapRef,
//   ) => {
//     const selectedVehicle = vehicleList.find((v) => v.id === selectedVehicleId);
//     const alerts =
//       selectedVehicle?.device?.structuredTrackingData?.alerts?.list || [];

//     return (
//       <Box sx={{ flex: 1, position: "relative" }}>
//         <MapContainer
//           center={DEFAULT_CENTER}
//           zoom={DEFAULT_ZOOM}
//           style={{ height: "100%", width: "100%", minHeight: 600 }}
//           ref={mapRef}
//         >
//           {/* Satellite base */}
//           <TileLayer
//             url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
//             attribution="Tiles © Esri"
//             maxZoom={18}
//           />
//           {/* Label overlay */}
//           <TileLayer
//             url="https://mt1.google.com/vt/lyrs=h&x={x}&y={y}&z={z}"
//             attribution="Google"
//             maxZoom={18}
//           />

//           {/* ── SELECTED VEHICLE ONLY: planned route ── */}
//           {fullPath.length > 1 && (
//             <Polyline
//               positions={fullPath}
//               pathOptions={{ color: "#fff", weight: 5, dashArray: "1,10" }}
//             />
//           )}

//           {/* ── SELECTED VEHICLE ONLY: travelled trail ── */}
//           {trail.length > 1 && (
//             <>
//               <Polyline
//                 positions={trail}
//                 pathOptions={{ color: "white", weight: 5, opacity: 1 }}
//               />
//               <Polyline
//                 positions={trail}
//                 pathOptions={{ color: "#44307C", weight: 4, opacity: 1 }}
//               />
//             </>
//           )}

//           {/* ── SELECTED VEHICLE ONLY: stop markers ── */}
//           {stops.map((stop, i) => (
//             <Marker
//               key={`stop-${stop.index}`}
//               position={[stop.coordinates.latitude, stop.coordinates.longitude]}
//               icon={makeStopIcon(String(i + 1), STOP_COLORS[stopStatuses[i]])}
//               title={stop.name || `Station ${i + 1}`}
//             >
//               <Popup>
//                 <Box sx={{ minWidth: 160 }}>
//                   <Typography
//                     sx={{
//                       fontWeight: 700,
//                       color: "#8167e8",
//                       fontSize: 13,
//                     }}
//                   >
//                     Stop {i + 1}
//                   </Typography>
//                   <Typography
//                     sx={{
//                       fontSize: 12,
//                       color: "#8167e8",
//                       fontWeight: 600,
//                     }}
//                   >
//                     This Stop: {formatKm(stop.cumulative_km ?? 0)}
//                     <br></br>
//                     {stop.name}
//                   </Typography>
//                   <Typography
//                     sx={{
//                       color: "#766e95",
//                       fontSize: 12,
//                     }}
//                   >
//                     Next Stop:
//                     {formatKm(
//                       i === stops.length - 1
//                         ? 0
//                         : (stops[i + 1].segment_km ?? 0),
//                     )}
//                     <br></br>
//                     {i === stops.length - 1
//                       ? "No Next Stop"
//                       : stops[i + 1].name}
//                   </Typography>
//                   <Chip
//                     label={
//                       "● " +
//                       stopStatuses[i].charAt(0).toUpperCase() +
//                       stopStatuses[i].slice(1)
//                     }
//                     size="small"
//                     sx={{
//                       mt: 1,
//                       height: 18,
//                       fontSize: 9,
//                       bgcolor: STOP_COLORS[stopStatuses[i]],
//                       color: "#000000",
//                       border: "1px solid #828282",
//                     }}
//                   />
//                 </Box>
//               </Popup>
//             </Marker>
//           ))}

//           {/* ── SELECTED VEHICLE ONLY: alerts markers ── */}
//           {alerts.map((alert) => (
//             <Marker
//               key={`alert-${alert.ts}`}
//               position={[alert.locs.lat, alert.locs.lat]}
//               icon={makeAlertIcon(alert.message)}
//               title={alert.message}
//             >
//               <Popup>
//                 <Box
//                   sx={{
//                     minWidth: 260,
//                     maxWidth: 300,
//                     borderRadius: 2,
//                     backgroundColor: "#fff",
//                   }}
//                 >
//                   {(() => {
//                     const alertType = alert.message?.toLowerCase();
//                     const alertConfig = ALERT_MAP[alertType] ?? {
//                       icon: "⚠️",
//                       color: "#8167e8",
//                     };

//                     return (
//                       <>
//                         <Typography
//                           sx={{
//                             fontSize: 10,
//                             fontWeight: 700,
//                             color: "#999",
//                             textTransform: "uppercase",
//                             letterSpacing: 0.8,
//                             lineHeight: 1.2,
//                           }}
//                         >
//                           Vehicle Alert{" "}
//                           {selectedVehicle &&
//                             "(" + selectedVehicle.registrationNumber + ")"}
//                         </Typography>
//                         {/* Header */}
//                         <Box
//                           sx={{
//                             display: "flex",
//                             alignItems: "center",
//                             justifyContent: "space-between",
//                           }}
//                         >
//                           <Box
//                             sx={{
//                               display: "flex",
//                               alignItems: "center",
//                               gap: 1,
//                             }}
//                           >
//                             {/* Alert Icon */}
//                             <Box
//                               sx={{
//                                 width: 34,
//                                 height: 34,
//                                 borderRadius: "10px",
//                                 display: "flex",
//                                 alignItems: "center",
//                                 justifyContent: "center",
//                                 backgroundColor: `${alertConfig.color}15`,
//                                 border: `1px solid ${alertConfig.color}30`,
//                                 fontSize: 17,
//                               }}
//                             >
//                               {alertConfig.icon}
//                             </Box>

//                             {/* Alert Type */}
//                             <Box>
//                               <Typography
//                                 sx={{
//                                   fontSize: 13,
//                                   fontWeight: 700,
//                                   color: alertConfig.color,
//                                   textTransform: "capitalize",
//                                   lineHeight: 1.4,
//                                 }}
//                               >
//                                 {alert.type}
//                               </Typography>
//                             </Box>
//                           </Box>
//                         </Box>

//                         {/* Message */}
//                         <Typography
//                           sx={{
//                             fontSize: 15,
//                             fontWeight: 700,
//                             color: "#222",
//                             lineHeight: 1.4,
//                           }}
//                         >
//                           {alert.message}
//                         </Typography>

//                         {/* Details */}
//                         <Box
//                           sx={{
//                             borderTop: "1px solid #eee",
//                           }}
//                         >
//                           <Box
//                             sx={{
//                               display: "grid",
//                               gridTemplateColumns: "72px 1fr",
//                             }}
//                           >
//                             <Typography sx={{ fontSize: 11, color: "#999" }}>
//                               Time
//                             </Typography>
//                             <Typography
//                               sx={{
//                                 fontSize: 11,
//                                 fontWeight: 600,
//                                 color: "#444",
//                               }}
//                             >
//                               {new Date(alert.ts).toLocaleString()}
//                             </Typography>

//                             <Typography sx={{ fontSize: 11, color: "#999" }}>
//                               Latitude
//                             </Typography>
//                             <Typography
//                               sx={{
//                                 fontSize: 11,
//                                 fontWeight: 600,
//                                 color: "#444",
//                               }}
//                             >
//                               {alert.locs.lat}
//                             </Typography>

//                             <Typography sx={{ fontSize: 11, color: "#999" }}>
//                               Longitude
//                             </Typography>
//                             <Typography
//                               sx={{
//                                 fontSize: 11,
//                                 fontWeight: 600,
//                                 color: "#444",
//                               }}
//                             >
//                               {alert.locs.lng}
//                             </Typography>

//                             <Typography sx={{ fontSize: 11, color: "#999" }}>
//                               Altitude
//                             </Typography>
//                             <Typography
//                               sx={{
//                                 fontSize: 11,
//                                 fontWeight: 600,
//                                 color: "#444",
//                               }}
//                             >
//                               {alert.locs.alt} m
//                             </Typography>
//                           </Box>
//                         </Box>
//                       </>
//                     );
//                   })()}
//                 </Box>
//               </Popup>
//             </Marker>
//           ))}

//           {/* ── ALL VEHICLES: bus markers (always on map) ── */}
//           {allVehicleLocs.map((loc) => {
//             const isSelected = loc.id === selectedVehicleId;
//             const vehicleData = vehicleList.find((v) => v.id === loc.id);
//             if (!vehicleData) {
//               return null;
//             }

//             const vehicleStatus =
//               vehicleData.device?.structuredTrackingData?.general?.status ??
//               "offline";
//             const vehicleIgnition =
//               vehicleData.device?.structuredTrackingData?.general?.ignition ??
//               "off";
//             const vehicleMoving =
//               vehicleData.device?.structuredTrackingData?.general?.moving ??
//               "stopped";

//             return (
//               <Marker
//                 key={`vehicle-${loc.id}`}
//                 position={getLocLatLng(loc)}
//                 icon={makeVehicleIcon(isSelected, vehicleStatus)}
//                 zIndexOffset={isSelected ? 1000 : 0}
//                 title={vehicleData.registrationNumber}
//               >
//                 <Popup closeButton={false}>
//                   <Box
//                     sx={{
//                       width: 280,
//                       overflow: "hidden",
//                       borderRadius: 2,
//                       fontFamily: "Roboto, Arial, sans-serif",
//                     }}
//                   >
//                     {/* Vehicle Image */}
//                     <Box
//                       sx={{
//                         width: "100%",
//                         height: 130,
//                         bgcolor: "#f4f4f5",
//                         overflow: "hidden",
//                       }}
//                     >
//                       {vehicleData.images?.length > 0 ? (
//                         <Box
//                           component="img"
//                           src={
//                             import.meta.env.VITE_BACKEND_HOST +
//                             vehicleData.images[0].url
//                           }
//                           alt={vehicleData.registrationNumber}
//                           sx={{
//                             width: "100%",
//                             height: "100%",
//                             objectFit: "cover",
//                             display: "block",
//                           }}
//                         />
//                       ) : (
//                         <Box
//                           sx={{
//                             width: "100%",
//                             height: "100%",
//                             display: "flex",
//                             alignItems: "center",
//                             justifyContent: "center",
//                             color: "#aaa",
//                             fontSize: 12,
//                           }}
//                         >
//                           No vehicle image
//                         </Box>
//                       )}
//                     </Box>

//                     {/* Information */}
//                     <Box>
//                       {/* Registration + Status */}
//                       <Box
//                         sx={{
//                           display: "flex",
//                           alignItems: "center",
//                           justifyContent: "space-between",
//                           gap: 1,
//                         }}
//                       >
//                         <Typography
//                           sx={{
//                             fontSize: 17,
//                             fontWeight: 700,
//                             color: "#202124",
//                           }}
//                         >
//                           {vehicleData.registrationNumber}
//                         </Typography>

//                         <Box
//                           sx={{
//                             display: "flex",
//                             alignItems: "center",
//                             gap: 0.5,
//                             px: 0.8,
//                             py: 0.35,
//                             borderRadius: 5,
//                             bgcolor:
//                               vehicleStatus === "online"
//                                 ? "rgba(46,125,50,0.1)"
//                                 : "rgba(117,117,117,0.1)",
//                           }}
//                         >
//                           <Box
//                             sx={{
//                               width: 7,
//                               height: 7,
//                               borderRadius: "50%",
//                               bgcolor:
//                                 vehicleStatus === "online" ? "#2e7d32" : "#888",
//                             }}
//                           />

//                           <Typography
//                             sx={{
//                               fontSize: 9,
//                               fontWeight: 700,
//                               color:
//                                 vehicleStatus === "online" ? "#2e7d32" : "#777",
//                             }}
//                           >
//                             {vehicleStatus === "online" ? "LIVE" : "OFFLINE"}
//                           </Typography>
//                         </Box>
//                       </Box>

//                       {/* Vehicle details */}
//                       <Typography
//                         sx={{
//                           fontSize: 11,
//                           color: "#777",
//                         }}
//                       >
//                         {vehicleData.type}
//                         {" • "}
//                         {vehicleData.make}
//                         {" • "}
//                         {vehicleData.model}
//                       </Typography>

//                       {/* Status */}
//                       <Box
//                         sx={{
//                           display: "flex",
//                           gap: 1,
//                         }}
//                       >
//                         <Box
//                           sx={{
//                             flex: 1,
//                             px: 1,
//                             py: 0.8,
//                             bgcolor: "#f7f7f8",
//                             borderRadius: 1,
//                           }}
//                         >
//                           <Typography
//                             sx={{
//                               fontSize: 9,
//                               color: "#888",
//                             }}
//                           >
//                             MOVEMENT
//                           </Typography>

//                           <Typography
//                             sx={{
//                               mt: 0.2,
//                               fontSize: 12,
//                               fontWeight: 600,
//                               textTransform: "capitalize",
//                             }}
//                           >
//                             {vehicleMoving ?? "Stopped"}
//                           </Typography>
//                         </Box>

//                         <Box
//                           sx={{
//                             flex: 1,
//                             px: 1,
//                             py: 0.8,
//                             bgcolor: "#f7f7f8",
//                             borderRadius: 1,
//                           }}
//                         >
//                           <Typography
//                             sx={{
//                               fontSize: 9,
//                               color: "#888",
//                             }}
//                           >
//                             IGNITION
//                           </Typography>

//                           <Typography
//                             sx={{
//                               mt: 0.2,
//                               fontSize: 12,
//                               fontWeight: 600,
//                               textTransform: "uppercase",
//                             }}
//                           >
//                             {vehicleIgnition ?? "OFF"}
//                           </Typography>
//                         </Box>
//                       </Box>

//                       {/* View Full Details */}
//                       {
//                         <Button
//                           fullWidth
//                           size="small"
//                           variant="contained"
//                           onClick={() => null}
//                           sx={{
//                             mt: 1.5,
//                             height: 36,
//                             borderRadius: 1.5,
//                             textTransform: "none",
//                             fontSize: 12,
//                             fontWeight: 600,
//                             bgcolor: "#d8d7d8",
//                             color: "black",
//                             boxShadow: "none",
//                             "&:hover": {
//                               bgcolor: "#362563",
//                               color: "white",
//                               boxShadow: "none",
//                             },
//                           }}
//                         >
//                           View Full Details
//                         </Button>
//                       }

//                       {/* Track */}
//                       {!isSelected && (
//                         <Button
//                           fullWidth
//                           size="small"
//                           variant="contained"
//                           onClick={() => onSelectVehicle(loc.id)}
//                           sx={{
//                             mt: 1.5,
//                             height: 36,
//                             borderRadius: 1.5,
//                             textTransform: "none",
//                             fontSize: 12,
//                             fontWeight: 600,
//                             bgcolor: "#44307c",
//                             boxShadow: "none",
//                             "&:hover": {
//                               bgcolor: "#362563",
//                               boxShadow: "none",
//                             },
//                           }}
//                         >
//                           Track
//                         </Button>
//                       )}

//                       {isSelected && (
//                         <Chip
//                           label="● TRACKING"
//                           size="small"
//                           sx={{
//                             mt: 1.5,
//                             height: 24,
//                             width: "100%",
//                             fontSize: 10,
//                             fontWeight: 600,
//                             bgcolor: "rgba(68,48,124,0.1)",
//                             color: "#44307c",
//                             border: "1px solid rgba(68,48,124,0.25)",
//                           }}
//                         />
//                       )}
//                     </Box>
//                   </Box>
//                 </Popup>
//               </Marker>
//             );
//           })}

//           {/* Follow the selected vehicle */}
//           {activeLoc && (
//             <MapController lat={displayLat} lng={displayLng} follow={follow} />
//           )}
//         </MapContainer>
//       </Box>
//     );
//   },
// );

// TrackingMap.displayName = "TrackingMap";

// export default TrackingMap;
