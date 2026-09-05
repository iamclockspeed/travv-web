import React, { useEffect } from "react";
import { useMap } from "react-leaflet";

interface MapControllerProps {
  lat: number;
  lng: number;
  follow: boolean;
}

/** Pans the map to (lat, lng) whenever it changes, if `follow` is enabled. */
const MapController: React.FC<MapControllerProps> = ({ lat, lng, follow }) => {
  const map = useMap();
  useEffect(() => {
    if (follow) map.panTo([lat, lng], { animate: true, duration: 0.6 });
  }, [lat, lng, follow, map]);
  return null;
};

export default MapController;
