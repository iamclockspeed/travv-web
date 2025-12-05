import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

import { useParams } from "react-router-dom";
import { useGetOne } from "react-admin";
import { Card, CardContent, CardHeader } from "@mui/material";

const defaultIcon = L.icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

export interface LeafletLocationMapProps {
  lat: number;
  lng: number;
  zoom?: number;
}

const LeafletLocationMap: React.FC<LeafletLocationMapProps> = ({
  lat,
  lng,
  zoom = 13,
}) => {
  const position: [number, number] = [lat, lng];

  return (
    <div style={{ height: "400px", width: "100%" }}>
      <MapContainer
        center={position}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position}>
          <Popup>
            Live location: {lat.toFixed(5)}, {lng.toFixed(5)}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

interface LocationRecord {
  id: string | number;
  lat: number;
  lng: number;
}

const POLL_INTERVAL_MS = 5000; // 5 seconds

const VehicleRouteSimulator: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error, refetch } = useGetOne<LocationRecord>(
    "locations",
    { id: id ?? "" }
  );

  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [refetch]);

  if (isLoading) return <div>Loading live location...</div>;
  if (error || !data) return <div>Error loading location</div>;

  return (
    <Card>
      <CardHeader title={`Live Location for ID: ${data.id}`} />
      <CardContent>
        <LeafletLocationMap lat={data.lat} lng={data.lng} />
      </CardContent>
    </Card>
  );
};

export default VehicleRouteSimulator;
