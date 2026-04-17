import VehiclesTableSimple from "../../components/vehicles-list-table";

const CrashDetectedVehicles = () => {
  return (
    <VehiclesTableSimple
      resource={"totalVehicles"}
      filter={{ "structuredTrackingData.safety.alerts.type": "crash detected" }}
    />
  );
};

export default CrashDetectedVehicles;
