import VehiclesTableSimple from "../../components/vehicles-list-table";

const OfflineVehicles = () => {
  return (
    <VehiclesTableSimple
      resource={"totalVehicles"}
      filter={{ "structured.status": "offline" }}
    />
  );
};

export default OfflineVehicles;
