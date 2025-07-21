import {
  ListBase,
  useListContext,
  useListFilterContext,
  useRecordContext,
  FunctionField,
  Datagrid,
  TextField,
  DateField,
  TextInput,
  FilterForm,
  Pagination,
} from "react-admin";
import {
  Box,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import MapIcon from "@mui/icons-material/Map";
import { useState } from "react";

// --------------------------------------------
// ✅ Interfaces
// --------------------------------------------
interface Vehicle {
  id: number;
  vehicleNumber: string;
  vehicleClass: string;
  status: string;
  alerts: string;
  location: string;
}

interface VehicleDetailsModalProps {
  open: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
}

// --------------------------------------------
// ✅ Filters Component
// --------------------------------------------
const filterInputs = [
  <TextInput
    label="Vehicle Number / Class"
    source="vehicleNumber"
    alwaysOn
    key="vehicleNumber"
  />,
];

const VehicleFilters = () => {
  const filterContext = useListFilterContext();
  return (
    <Box sx={{ mb: 2 }}>
      <FilterForm filters={filterInputs} {...filterContext} />
    </Box>
  );
};

// --------------------------------------------
// ✅ Modal Component
// --------------------------------------------
const VehicleDetailsModal: React.FC<VehicleDetailsModalProps> = ({
  open,
  onClose,
  vehicle,
}) => {
  if (!vehicle) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Vehicle Details
        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Typography>ID: {vehicle.id}</Typography>
        <Typography>Vehicle Number: {vehicle.vehicleNumber}</Typography>
        <Typography>Status: {vehicle.status}</Typography>
        <Typography>Location: {vehicle.location}</Typography>
      </DialogContent>
    </Dialog>
  );
};

// --------------------------------------------
// ✅ Table Component
// --------------------------------------------
const StatusWithIcon = () => {
  const record = useRecordContext();
  if (!record) return null;

  const { status } = record;
  let icon = "⚪";

  switch (status) {
    case "active":
      icon = "🟢";
      break;
    case "offline":
      icon = "🔴";
      break;
    case "idle":
      icon = "🟡";
      break;
  }

  return (
    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      {icon} {status}
    </span>
  );
};

const LocationWithLink = () => {
  const record = useRecordContext();
  if (!record) return null;

  const { location } = record;

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <IconButton title="View on Map">
        <MapIcon />
      </IconButton>
      <span>{location}</span>
    </Box>
  );
};

const VehicleTable: React.FC = () => {
  const { data, isLoading } = useListContext<Vehicle>();
  const [open, setOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  if (isLoading) return <p>Loading...</p>;
  if (!data) return <p>No data</p>;

  const handleRowClick = (id: string | number) => {
    const vehicle = data.find((v) => v.id === id);
    setSelectedVehicle(vehicle ?? null);
    setOpen(true);
  };

  return (
    <>
      <Datagrid
        bulkActionButtons={false}
        rowClick={(id) => {
          handleRowClick(id);
          return false;
        }}
      >
        <TextField source="id" label="Sl" />
        <TextField source="vehicleNumber" />
        <TextField source="vehicleClass" />
        <FunctionField source="status" render={() => <StatusWithIcon />} />
        <TextField source="alerts" />
        <FunctionField source="location" render={() => <LocationWithLink />} />
      </Datagrid>

      <Pagination />

      <VehicleDetailsModal
        open={open}
        onClose={() => setOpen(false)}
        vehicle={selectedVehicle}
      />
    </>
  );
};

// --------------------------------------------
// ✅ Final Page Component
// --------------------------------------------
const TotalVehicles: React.FC = () => (
  <ListBase
    resource="totalVehicles"
    perPage={10}
    sort={{ field: "id", order: "DESC" }}
  >
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

export default TotalVehicles;
