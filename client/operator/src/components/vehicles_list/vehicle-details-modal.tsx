import { useState } from "react";
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  Tabs,
  Tab,
  IconButton,
  CircularProgress,
} from "@mui/material";
import type { VehicleDetailsModalProps, TabPanelProps } from "./types-vehicles";
import BasicDetailsTab from "./tabs/basics-details";
import AlertsHistoryTab from "./tabs/alerts-history";
import DoccumentsTab from "./tabs/doccuments";
import CloseIcon from "@mui/icons-material/Close";

// --------------------------------------------
// ✅ Modal Component
// --------------------------------------------
const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ mt: 2 }}>{children}</Box>}
    </div>
  );
};

export const VehicleDetailsModal: React.FC<VehicleDetailsModalProps> = ({
  open,
  onClose,
  vehicle,
  onFullDataFetch,
}) => {
  const [tabIndex, setTabIndex] = useState(0);

  if (!vehicle) return null;
  if (!onFullDataFetch) return null;

  const fullVehicleData = onFullDataFetch(vehicle.id);

  if (!fullVehicleData) return null;

  if (typeof fullVehicleData === "boolean") {
    return (
      <Dialog open={open}>
        <Box p={4} display="flex" justifyContent="center">
          <CircularProgress onEnded={onClose} />
        </Box>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
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
        <Tabs
          value={tabIndex}
          onChange={(_, v) => setTabIndex(v)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Basic Details" />
          {/* <Tab label="Trips" /> */}
          {/* <Tab label="Fuel Logs" /> */}
          <Tab label="Alert History" />
          {/* <Tab label="Maintenance Logs" /> */}
          <Tab label="Documents" />
        </Tabs>

        {/* Basic Details */}
        <TabPanel value={tabIndex} index={0}>
          <BasicDetailsTab vehicle={fullVehicleData} />
        </TabPanel>

        {/* Alert History */}
        <TabPanel value={tabIndex} index={1}>
          <AlertsHistoryTab vehicle={fullVehicleData} />
        </TabPanel>

        {/* Documents */}
        <TabPanel value={tabIndex} index={2}>
          <DoccumentsTab vehicle={fullVehicleData} />
        </TabPanel>
      </DialogContent>
    </Dialog>
  );
};
