import VehiclesTableSimple from "../../components/vehicles-list-table";

const IdleVehicles = () => {
  return (
    <VehiclesTableSimple
      resource={"totalVehicles"}
      filter={{ "structured.status": "idle" }}
    />
  );
};

export default IdleVehicles;
