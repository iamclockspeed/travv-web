import VehiclesTableSimple from "../../components/vehicles-list-table";

const ActiveVehicles = () => {
  return (
    <VehiclesTableSimple
      resource={"totalVehicles"}
      filter={{ "structured.status": "active" }}
    />
  );
};

export default ActiveVehicles;
