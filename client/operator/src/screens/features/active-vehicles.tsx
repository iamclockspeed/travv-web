import VehiclesTableSimple from "../../components/vehicles-list-table";

const ActiveVehicles = () => {
  return (
    <VehiclesTableSimple
      resource={"totalVehicles"}
      filter={{ "structuredTrackingData.status": "active" }}
    />
  );
};

export default ActiveVehicles;
