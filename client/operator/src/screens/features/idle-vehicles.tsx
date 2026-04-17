import VehiclesTableSimple from "../../components/vehicles-list-table";

const IdleVehicles = () => {
  return (
    <VehiclesTableSimple
      resource={"totalVehicles"}
      filter={{ "structuredTrackingData.status": "idle" }}
    />
  );
};

export default IdleVehicles;
