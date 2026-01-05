import VehiclesTableSimple from "../../components/vehicles-list-table";

const OverSpeedingVehicles = () => {
  return (
    <VehiclesTableSimple
      resource={"totalVehicles"}
      filter={{ "structured.safety.alerts.type": "over speeding" }}
    />
  );
};

export default OverSpeedingVehicles;
