import VehiclesTableSimple from "../components/vehicles_list/vehicles-list-table";

export const TotalVehicles = () => {
  return <VehiclesTableSimple resource={"totalVehiclesOverview"} />;
};

export const ActiveVehicles = () => {
  return (
    <VehiclesTableSimple
      resource={"totalVehiclesOverview"}
      filter={{ "std.general.status": "active" }}
    />
  );
};

export const IdleVehicles = () => {
  return (
    <VehiclesTableSimple
      resource={"totalVehiclesOverview"}
      filter={{ "std.general.status": "idle" }}
    />
  );
};

export const ParkedVehicles = () => {
  return (
    <VehiclesTableSimple
      resource={"totalVehiclesOverview"}
      filter={{ "std.general.status": "parked" }}
    />
  );
};

export const OfflineVehicles = () => {
  return (
    <VehiclesTableSimple
      resource={"totalVehiclesOverview"}
      filter={{ "std.general.status": "offline" }}
    />
  );
};

export const OverSpeedingVehicles = () => {
  return (
    <VehiclesTableSimple
      resource={"totalVehiclesOverview"}
      filter={{ "std.alerts.list.message": "over speeding" }}
    />
  );
};

export const GeoFenceViolatingVehicles = () => {
  return (
    <VehiclesTableSimple
      resource="totalVehiclesOverview"
      filter={{
        "std.alerts.list.message": "geofence violation",
      }}
    />
  );
};

export const CrashDetectedVehicles = () => {
  return (
    <VehiclesTableSimple
      resource={"totalVehiclesOverview"}
      filter={{ "std.alerts.list.message": "crash detected" }}
    />
  );
};

export const ExcessiveIdleVehicles = () => {
  return (
    <VehiclesTableSimple
      resource="totalVehiclesOverview"
      filter={{
        "std.alerts.list.message": "excessive idle",
      }}
    />
  );
};

export const LowFuelVehicles = () => {
  return (
    <VehiclesTableSimple
      resource="totalVehiclesOverview"
      filter={{
        "std.alerts.list.message": "low fuel",
      }}
    />
  );
};

export const LowBatteryVehicles = () => {
  return (
    <VehiclesTableSimple
      resource="totalVehiclesOverview"
      filter={{
        "std.alerts.list.message": "low battery",
      }}
    />
  );
};

export const UnpluggedVehicles = () => {
  return (
    <VehiclesTableSimple
      resource="totalVehiclesOverview"
      filter={{
        "std.alerts.list.message": "unplugged",
      }}
    />
  );
};

export const TowingVehicles = () => {
  return (
    <VehiclesTableSimple
      resource="totalVehiclesOverview"
      filter={{
        "std.alerts.list.message": "towing",
      }}
    />
  );
};
