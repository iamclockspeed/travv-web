import React, { useRef } from "react";
import type { Map as LeafletMap } from "leaflet";
import { useParams } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Divider,
  Typography,
  Button,
  FormControlLabel,
  Switch,
} from "@mui/material";

import "../components/live_tracking/mapIcons"; // applies the Leaflet default-icon fix as a side effect
import { useLiveTracking } from "../components/live_tracking/useLiveTracking";
import TrackingSidebar from "../components/live_tracking/TrackingSidebar";
import TrackingMap from "../components/live_tracking/TrackingMap";

const LiveTracking: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const mapRef = useRef<LeafletMap | null>(null);

  const {
    vehicleList,
    vehiclesLoading,
    selectedVehicleId,
    handleSelectVehicle,
    stops,
    longestStopSegmentKm,
    fullPath,
    isRouteLoading,
    routeError,
    stopStatuses,
    projectionKm,
    flyToStop,
    allVehicleLocs,
    activeLoc,
    displayLat,
    displayLng,
    trail,
    follow,
    setFollow,
    handleCenterMap,
  } = useLiveTracking(id ?? null, mapRef);

  const vehicleOptions = vehicleList.map((v) => ({
    label: v.registrationNumber,
    id: v.id,
  }));

  return (
    <Card sx={{ height: "100vh", overflow: "hidden" }}>
      <CardContent
        sx={{ display: "flex", flexDirection: "column", height: "100%", p: 2 }}
      >
        {/* ── Header ── */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={1}
        >
          <Typography variant="h5">Live Vehicle Tracking</Typography>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <FormControlLabel
              control={
                <Switch
                  checked={follow}
                  onChange={() => setFollow((x) => !x)}
                  disabled={!activeLoc}
                />
              }
              label="Follow vehicle"
            />
            <Button
              variant="outlined"
              disabled={!activeLoc}
              onClick={handleCenterMap}
            >
              Center Map
            </Button>
          </Box>
        </Box>

        <Divider sx={{ mb: 1 }} />

        {/* ── Body ── */}
        <Box sx={{ flex: 1, display: "flex", gap: 2, overflow: "hidden" }}>
          <TrackingSidebar
            vehicleOptions={vehicleOptions}
            vehiclesLoading={vehiclesLoading}
            selectedVehicleId={selectedVehicleId}
            onSelectVehicle={handleSelectVehicle}
            isRouteLoading={isRouteLoading}
            routeError={routeError}
            stops={stops}
            stopStatuses={stopStatuses}
            longestStopSegmentKm={longestStopSegmentKm}
            projectionKm={projectionKm}
            onStopClick={flyToStop}
          />

          <TrackingMap
            ref={mapRef}
            fullPath={fullPath}
            trail={trail}
            stops={stops}
            stopStatuses={stopStatuses}
            allVehicleLocs={allVehicleLocs}
            vehicleList={vehicleList}
            selectedVehicleId={selectedVehicleId}
            onSelectVehicle={handleSelectVehicle}
            activeLoc={activeLoc}
            displayLat={displayLat}
            displayLng={displayLng}
            follow={follow}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default LiveTracking;
