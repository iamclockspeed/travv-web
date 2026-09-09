import { memo } from "react";
import { Polyline } from "react-leaflet";
import type { LatLngTuple } from "leaflet";

interface RouteLayersProps {
  fullPath: LatLngTuple[];
  trail: LatLngTuple[];
}

function RouteLayersImpl({ fullPath, trail }: RouteLayersProps) {
  return (
    <>
      {/* Planned route */}
      {fullPath.length > 1 && (
        <Polyline
          positions={fullPath}
          pathOptions={{ color: "#fff", weight: 5, dashArray: "1,10" }}
        />
      )}

      {/* Travelled trail */}
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
    </>
  );
}

// fullPath only changes when the selected vehicle's route loads; trail only
// grows when the vehicle actually moves to a new point. Neither depends on
// the once-per-poll allVehicleLocs array, so this never re-renders on a
// tick where only OTHER vehicles moved.
export default memo(RouteLayersImpl);
