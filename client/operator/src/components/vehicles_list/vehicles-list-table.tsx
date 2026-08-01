import { useState } from "react";
import { useDataProvider } from "react-admin";
import { useQuery } from "@tanstack/react-query";
import {
  ListBase,
  useListContext,
  useListFilterContext,
  FunctionField,
  Datagrid,
  TextField,
  TextInput,
  FilterForm,
  Pagination,
  type ListBaseProps,
} from "react-admin";
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
} from "@mui/material";
import type { Vehicle, VehicleAlert } from "./types-vehicles";
import {
  AlertsWithBadges,
  LocationWithLink,
  StatusWithIcon,
} from "./utilities";
import { VehicleDetailsModal } from "./vehicle-details-modal";

// --------------------------------------------
// ✅ Filters Component
// --------------------------------------------
const VehicleFilters = () => {
  const filterContext = useListFilterContext();
  return (
    <Box sx={{ mb: 2 }}>
      <FilterForm
        filters={[
          <TextInput
            label="Vehicle Number / Model"
            source="vehicle"
            alwaysOn
            key="vehicle"
          />,
        ]}
        {...filterContext}
      />
    </Box>
  );
};

// --------------------------------------------
// ✅ Table Component
// --------------------------------------------
const VehicleTable: React.FC = () => {
  const { page, perPage, data, isLoading } = useListContext<Vehicle>();
  const [open, setOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [modalVersion, setModalVersion] = useState(0);
  const dataProvider = useDataProvider();

  const handleRowClick = (id: string | number | undefined) => {
    const vehicle = data?.find((v) => v.id === id) || null;
    setSelectedVehicle(vehicle);
    setModalVersion((v) => v + 1);
    setOpen(true);
  };

  const handleFullDataFetch = (vehicleId: number) => {
    const { data: fullData, isLoading: isDataLoading } = useQuery({
      queryKey: ["full-vehicle-details", vehicleId],
      queryFn: () => (dataProvider as any).getVehicleById({ id: vehicleId }),
    });
    if (isDataLoading) {
      return isDataLoading;
    }
    return fullData?.data;
  };

  const handleAlertUpdate = (
    vehicleId: number,
    updatedAlerts: VehicleAlert[],
  ) => {
    if (selectedVehicle?.id === vehicleId) {
      selectedVehicle.device.structuredTrackingData ??= {};
      selectedVehicle.device.structuredTrackingData.safety ??= {};
      selectedVehicle.device.structuredTrackingData.safety.alerts =
        updatedAlerts;

      setSelectedVehicle({ ...selectedVehicle });
    }
  };

  if (isLoading)
    return (
      <Box display="flex" gap={1} justifyContent="left" alignItems="center">
        <Typography variant="subtitle1">Loading</Typography>
        <CircularProgress size={20} />
      </Box>
    );

  if (!data) return <p>No data available</p>;

  return (
    <>
      <Datagrid
        bulkActionButtons={false}
        rowClick={(id) => {
          handleRowClick(id);
          return false;
        }}
        empty={<div>No data found</div>}
      >
        <FunctionField
          label="Sl"
          render={(record) => {
            const index = data.findIndex((v) => v.id === record.id);
            return (page - 1) * perPage + index + 1;
          }}
        />
        <FunctionField
          label="Image"
          render={(record: Vehicle) =>
            record.images.length > 0 ? (
              <img
                src={import.meta.env.VITE_BACKEND_HOST + record.images[0].url}
                alt="vehicle image"
                style={{
                  width: 40,
                  height: 40,
                  objectFit: "cover",
                  borderRadius: 4,
                }}
              />
            ) : (
              <span style={{ color: "#ccc" }}>No Image</span>
            )
          }
        />
        <TextField source="registrationNumber" />
        <FunctionField
          label="Make / Model"
          render={(record) => `${record.make} ${record.model}`}
        />
        <FunctionField
          label="Status"
          render={(record) => (
            <StatusWithIcon
              status={record.device?.structuredTrackingData?.status}
            />
          )}
        />
        <FunctionField label="Alerts" render={() => <AlertsWithBadges />} />
        <FunctionField label="Location" render={() => <LocationWithLink />} />
      </Datagrid>
      <Pagination />
      <VehicleDetailsModal
        key={`${selectedVehicle?.id}-${modalVersion}`}
        open={open}
        onClose={() => setOpen(false)}
        vehicle={selectedVehicle}
        onAlertUpdate={handleAlertUpdate}
        onFullDataFetch={handleFullDataFetch}
      />
    </>
  );
};

// --------------------------------------------
// ✅ Final Component
// --------------------------------------------
const VehiclesTableSimple = (props: ListBaseProps) => (
  <ListBase {...props} perPage={10} sort={{ field: "id", order: "DESC" }}>
    <Card>
      <CardContent>
        <Box>
          <VehicleFilters />
          <VehicleTable />
        </Box>
      </CardContent>
    </Card>
  </ListBase>
);

export default VehiclesTableSimple;
