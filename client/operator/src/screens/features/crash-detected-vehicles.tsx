import VehiclesTableSimple from "../../components/vehicles-list-table";

const CrashDetectedVehicles = () => {
  return (
    <VehiclesTableSimple
      resource={"totalVehicles"}
      filter={{ "structured.safety.alerts.type": "crash detected" }}
    />
  );
};

export default CrashDetectedVehicles;
