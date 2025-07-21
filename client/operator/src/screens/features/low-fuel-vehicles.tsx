import {
  ListBase,
  useListContext,
  useListFilterContext,
  Datagrid,
  TextField,
  DateField,
  TextInput,
  FilterForm,
  Pagination,
  Title,
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
import { useState } from "react";

// --------------------------------------------
// ✅ Interfaces
// --------------------------------------------
interface Vehicle {
  id: number;
  vehicleNumber: string;
  vehicleClass: string;
  status: string;
  location: string;
  lastActive: string;
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
    label="Vehicle Number"
    source="vehicleNumber"
    alwaysOn
    key="vehicleNumber"
  />,
  <TextInput label="Status" source="status" key="status" />,
  <TextInput label="Location" source="location" key="location" />,
];

const VehicleFilters = () => {
  const filterContext = useListFilterContext();
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <FilterForm filters={filterInputs} {...filterContext} />
      </CardContent>
    </Card>
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
        <Typography>Sl: {vehicle.id}</Typography>
        <Typography>Vehicle Number: {vehicle.vehicleNumber}</Typography>
        <Typography>Status: {vehicle.status}</Typography>
        <Typography>Location: {vehicle.location}</Typography>
        <Typography>
          Last Active: {new Date(vehicle.lastActive).toLocaleString()}
        </Typography>
      </DialogContent>
    </Dialog>
  );
};

// --------------------------------------------
// ✅ Table Component
// --------------------------------------------
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
          return false; // Prevent default edit navigation
        }}
      >
        <TextField source="id" label="Sl" />
        <TextField source="vehicleNumber" />
        <TextField source="vehicleClass" />
        <TextField source="status" />
        <TextField source="location" />
        <DateField source="lastActive" showTime />
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
const LowFuelVehicles: React.FC = () => (
  <ListBase
    resource="totalVehicles"
    perPage={5}
    sort={{ field: "id", order: "DESC" }}
  >
    <Box p={2}>
      <VehicleFilters />
      <VehicleTable />
    </Box>
  </ListBase>
);

export default LowFuelVehicles;
