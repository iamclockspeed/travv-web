import VehiclesTableSimple from "../../components/vehicles-list-table";

const GeoFenceViolatingVehicles = () => {
  return (
    <VehiclesTableSimple
      resource="totalVehicles"
      filter={{
        "structuredTrackingData.safety.alerts.type": "geofence violation",
      }}
    />
  );
};

export default GeoFenceViolatingVehicles;
