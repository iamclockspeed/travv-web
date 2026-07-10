import VehiclesTableSimple from "../components/vehicles_list/vehicles-list-table";

export const TotalVehicles = () => {
  return <VehiclesTableSimple resource={"totalVehicles"} />;
};

export const ActiveVehicles = () => {
  return (
    <VehiclesTableSimple
      resource={"totalVehicles"}
      filter={{ "structuredTrackingData.status": "active" }}
    />
  );
};

export const IdleVehicles = () => {
  return (
    <VehiclesTableSimple
      resource={"totalVehicles"}
      filter={{ "structuredTrackingData.status": "idle" }}
    />
  );
};

export const OfflineVehicles = () => {
  return (
    <VehiclesTableSimple
      resource={"totalVehicles"}
      filter={{ "structuredTrackingData.status": "offline" }}
    />
  );
};

export const OverSpeedingVehicles = () => {
  return (
    <VehiclesTableSimple
      resource={"totalVehicles"}
      filter={{ "structuredTrackingData.safety.alerts.type": "over speeding" }}
    />
  );
};

export const GeoFenceViolatingVehicles = () => {
  return (
    <VehiclesTableSimple
      resource="totalVehicles"
      filter={{
        "structuredTrackingData.safety.alerts.type": "geofence violation",
      }}
    />
  );
};

export const CrashDetectedVehicles = () => {
  return (
    <VehiclesTableSimple
      resource={"totalVehicles"}
      filter={{ "structuredTrackingData.safety.alerts.type": "crash detected" }}
    />
  );
};

export const EngineBreakdownVehicles = () => {
  return <VehiclesTableSimple resource="totalVehicles" />;
};

export const ExcessiveIdleVehicles = () => {
  return <VehiclesTableSimple resource="totalVehicles" />;
};

export const LowBatteryVehicles = () => {
  return <VehiclesTableSimple resource="totalVehicles" />;
};

export const LowFuelVehicles = () => {
  return <VehiclesTableSimple resource="totalVehicles" />;
};

export const UnTVehicles = () => {
  return <VehiclesTableSimple resource="totalVehicles" />;
};

export const UMVehicles = () => {
  return <VehiclesTableSimple resource="totalVehicles" />;
};
