import VehiclesTableSimple from "../../components/vehicles-list-table";

const OfflineVehicles = () => {
  return (
    <VehiclesTableSimple
      resource={"totalVehicles"}
      filter={{ "structuredTrackingData.status": "offline" }}
    />
  );
};

export default OfflineVehicles;
