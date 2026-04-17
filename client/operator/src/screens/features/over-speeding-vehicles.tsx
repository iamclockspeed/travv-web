import VehiclesTableSimple from "../../components/vehicles-list-table";

const OverSpeedingVehicles = () => {
  return (
    <VehiclesTableSimple
      resource={"totalVehicles"}
      filter={{ "structuredTrackingData.safety.alerts.type": "over speeding" }}
    />
  );
};

export default OverSpeedingVehicles;
