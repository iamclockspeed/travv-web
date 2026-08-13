import VehiclesTableSimple from "../components/vehicles_list/vehicles-list-table";

export const TotalVehicles = () => {
  return <VehiclesTableSimple resource={"totalVehiclesOverview"} />;
};

export const ActiveVehicles = () => {
  return (
    <VehiclesTableSimple
      resource={"totalVehiclesOverview"}
      filter={{ "structuredTrackingData.status": "active" }}
    />
  );
};

export const IdleVehicles = () => {
  return (
    <VehiclesTableSimple
      resource={"totalVehiclesOverview"}
      filter={{ "structuredTrackingData.status": "idle" }}
    />
  );
};

export const ParkedVehicles = () => {
  return (
    <VehiclesTableSimple
      resource={"totalVehiclesOverview"}
      filter={{ "structuredTrackingData.status": "parked" }}
    />
  );
};

export const OfflineVehicles = () => {
  return (
    <VehiclesTableSimple
      resource={"totalVehiclesOverview"}
      filter={{ "structuredTrackingData.status": "offline" }}
    />
  );
};

export const OverSpeedingVehicles = () => {
  return (
    <VehiclesTableSimple
      resource={"totalVehiclesOverview"}
      filter={{ "structuredTrackingData.safety.alerts.type": "over speeding" }}
    />
  );
};

export const GeoFenceViolatingVehicles = () => {
  return (
    <VehiclesTableSimple
      resource="totalVehiclesOverview"
      filter={{
        "structuredTrackingData.safety.alerts.type": "geofence violation",
      }}
    />
  );
};

export const CrashDetectedVehicles = () => {
  return (
    <VehiclesTableSimple
      resource={"totalVehiclesOverview"}
      filter={{ "structuredTrackingData.safety.alerts.type": "crash detected" }}
    />
  );
};

export const ExcessiveIdleVehicles = () => {
  return (
    <VehiclesTableSimple
      resource="totalVehiclesOverview"
      filter={{
        "structuredTrackingData.vehavior.alerts.type": "excessive idle",
      }}
    />
  );
};

export const LowFuelVehicles = () => {
  return (
    <VehiclesTableSimple
      resource="totalVehiclesOverview"
      filter={{
        "structuredTrackingData.vehavior.alerts.type": "low fuel",
      }}
    />
  );
};

export const LowBatteryVehicles = () => {
  return (
    <VehiclesTableSimple
      resource="totalVehiclesOverview"
      filter={{
        "structuredTrackingData.health.alerts.type": "low battery",
      }}
    />
  );
};

export const UnpluggedVehicles = () => {
  return (
    <VehiclesTableSimple
      resource="totalVehiclesOverview"
      filter={{
        "structuredTrackingData.health.alerts.type": "unplugged",
      }}
    />
  );
};

export const TowingVehicles = () => {
  return (
    <VehiclesTableSimple
      resource="totalVehiclesOverview"
      filter={{
        "structuredTrackingData.health.alerts.type": "towing",
      }}
    />
  );
};
