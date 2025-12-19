// VehicleRouteSimulator.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMapEvent,
} from "react-leaflet";
import type { Map as LeafletMap } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

import { useParams } from "react-router-dom";
import { useGetOne } from "react-admin";
import {
  Card,
  CardContent,
  CardHeader,
  FormControlLabel,
  Switch,
  Button,
  Box,
} from "@mui/material";

/** --- marker icon fix (leaflet default icons) --- */
const defaultIcon = L.icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

/** Types */
interface LocationRecord {
  id: string | number;
  lat: number;
  lng: number;
}

const POLL_INTERVAL_MS = 1000; // 5s polling
const MAX_TRAIL_POINTS = 1000; // keep trail bounded to avoid memory blow-up

/** Small invisible component to disable scroll-zoom while interacting if desired (optional) */
const DisableScrollZoomOnHold: React.FC<{
  mapRef: React.RefObject<LeafletMap | null>;
}> = ({ mapRef }) => {
  // example: you can implement keyboard hold behaviour here if you want.
  // currently this is a no-op placeholder.
  return null;
};

/** Main Map component */
const LeafletLocationMap: React.FC<{
  lat: number;
  lng: number;
  zoom?: number; // initial zoom only
  path: [number, number][];
  follow: boolean;
  onMapCreated: (map: LeafletMap) => void;
}> = ({ lat, lng, zoom = 13, path, follow, onMapCreated }) => {
  const initialPosition: [number, number] = [lat, lng];
  const mapRef = useRef<LeafletMap | null>(null);

  // store map instance once using whenCreated via callback prop
  useEffect(() => {
    if (mapRef.current) onMapCreated(mapRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapRef.current]);

  // pan to new position when follow is enabled (preserve zoom)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const pos: [number, number] = [lat, lng];
    if (follow) {
      // panTo preserves zoom. Use flyTo for a more dramatic movement:
      map.panTo(pos, { animate: true });
    }
  }, [lat, lng, follow]);

  return (
    <div style={{ height: "450px", width: "100%" }}>
      <MapContainer
        center={initialPosition}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
        whenCreated={(mapInstance) => {
          // assign once
          if (!mapRef.current) mapRef.current = mapInstance;
          onMapCreated(mapInstance);
        }}
      >
        <TileLayer
          url="https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community"
        />
        {path.length > 0 && <Polyline positions={path} />}
        <Marker position={[lat, lng]}>
          <Popup>
            Live location: {lat.toFixed(6)}, {lng.toFixed(6)}
          </Popup>
        </Marker>
        <DisableScrollZoomOnHold mapRef={mapRef} />
      </MapContainer>
    </div>
  );
};

/** Main page component */
const VehicleRouteSimulator: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // map & follow control refs/state
  const mapRef = useRef<LeafletMap | null>(null);
  const [follow, setFollow] = useState<boolean>(true);

  // path history
  const [path, setPath] = useState<[number, number][]>([]);

  // hold last position key to avoid duplicates noisy updates
  const lastPositionRef = useRef<string | null>(null);

  // initial center fallback (in case data not available yet)
  const [initialCenter, setInitialCenter] = useState<[number, number] | null>(
    null
  );

  // react-admin hook to fetch location record
  const { data, isLoading, error, refetch } = useGetOne<LocationRecord>(
    "locations",
    {
      id: id ?? "",
    }
  );

  // append new point to path when data updates
  useEffect(() => {
    if (!data) return;
    const key = `${Number(data.lat).toFixed(6)},${Number(data.lng).toFixed(6)}`;
    if (lastPositionRef.current !== key) {
      lastPositionRef.current = key;

      setPath((prev) => {
        const next = [...prev, [data.lat, data.lng]];
        // keep path bounded
        if (next.length > MAX_TRAIL_POINTS) {
          return next.slice(next.length - MAX_TRAIL_POINTS);
        }
        return next;
      });
    }

    // set initial center once (prevents MapContainer re-centering later)
    if (!initialCenter) setInitialCenter([data.lat, data.lng]);
  }, [data, initialCenter]);

  // polling
  useEffect(() => {
    const interval = setInterval(() => {
      refetch().catch(() => {
        /* ignore errors from refetch here; handled by react-admin's error state */
      });
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refetch]);

  // helper to programmatically center (with zoom) on the vehicle
  const centerOnVehicle = (zoomLevel?: number) => {
    const map = mapRef.current;
    if (!map || !data) return;
    if (typeof zoomLevel === "number") {
      map.setView([data.lat, data.lng], zoomLevel, { animate: true });
    } else {
      // preserve current zoom
      map.panTo([data.lat, data.lng], { animate: true });
    }
  };

  // callback when map created
  const handleMapCreated = (map: LeafletMap) => {
    if (!mapRef.current) mapRef.current = map;
  };

  if (isLoading && !data) return <div>Loading live location...</div>;
  if (error && !data) return <div>Error loading location</div>;
  if (!data && !initialCenter) return <div>No location data available</div>;

  // prefer initialCenter (set after first fetch) to avoid remount
  const initial = initialCenter ?? [data.lat, data.lng];

  return (
    <Card>
      <CardHeader title={`Live Location for ID: ${data?.id ?? id}`} />
      <CardContent>
        <Box display="flex" alignItems="center" gap={2} mb={1}>
          <FormControlLabel
            control={
              <Switch
                checked={follow}
                onChange={(e) => setFollow(e.target.checked)}
              />
            }
            label="Follow vehicle"
          />
          <Button
            variant="outlined"
            onClick={() => centerOnVehicle()}
            size="small"
          >
            Center (preserve zoom)
          </Button>
          <Button
            variant="outlined"
            onClick={() => centerOnVehicle(14)} // example desired zoom
            size="small"
          >
            Center & Zoom 14
          </Button>
        </Box>

        <LeafletLocationMap
          lat={data.lat}
          lng={data.lng}
          zoom={13}
          path={path}
          follow={follow}
          onMapCreated={handleMapCreated}
        />
      </CardContent>
    </Card>
  );
};

export default VehicleRouteSimulator;
