import {
  ListBase,
  useListContext,
  useListFilterContext,
  useRecordContext,
  FunctionField,
  Datagrid,
  TextField,
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
  Tabs,
  Tab,
  Typography,
  IconButton,
  Button,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import MapIcon from "@mui/icons-material/Map";
import { useState } from "react";
import Slider from "react-slick";

// --------------------------------------------
// ✅ Interfaces
// --------------------------------------------
interface Vehicle {
  id: number;
  vehicleNumber: string;
  type: string;
  make: string;
  model: string;
  status: string;
  fuelType: string;
  location: string;
  alertHistory: VehicleAlert[];
  fuelLogs: FuelLog[];
  trips: Trip[];
  maintenanceLogs: MaintenanceLog[];
  documents: VehicleDocuments;
  mainImage: string;
  images: string[];
}

interface VehicleAlert {
  type: string;
  time: string;
  location: string;
  unhandled: boolean;
}

interface FuelLog {
  date: string;
  location: string;
  amount: number;
  cost: number;
}

interface Trip {
  from: string;
  to: string;
  distance: number;
  duration: number;
  date: string;
}

interface MaintenanceLog {
  date: string;
  description: string;
}

interface VehicleDocuments {
  rcNumber: string;
  rcExpiry: string;
  fitnessExpiry: string;
  puccExpiry: string;
  insuranceExpiry: string;
  rcDocUrl?: string;
  insuranceDocUrl?: string;
  fitnessDocUrl?: string;
  puccDocUrl?: string;
  invoiceDocUrl?: string;
}

interface VehicleDetailsModalProps {
  open: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
  onAlertUpdate?: (vehicleId: number, updatedAlerts: VehicleAlert[]) => void;
}

interface TabPanelProps {
  children: React.ReactNode;
  value: number;
  index: number;
}

// --------------------------------------------
// ✅ Others Component
// --------------------------------------------
const ALERT_MAP: Record<string, { icon: string; color: string }> = {
  "over speeding": { icon: "🛑", color: "#e74c3c" },
  "geo fence violation": { icon: "📍", color: "#e74c3c" },
  "crash detected": { icon: "🚨", color: "#e74c3c" },
  "excessive idling": { icon: "⏳", color: "#f39c12" },
  "low fuel": { icon: "⛽", color: "#f39c12" },
  "engine breakdown": { icon: "🛠️", color: "#c0392b" },
  "unplug & towing": { icon: "🚛", color: "#c0392b" },
  "low battery": { icon: "🔋", color: "#c0392b" },
  "upcoming maintenance": { icon: "⚙️", color: "#c0392b" },
};

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
            source="v"
            alwaysOn
            key="v"
          />,
        ]}
        {...filterContext}
      />
    </Box>
  );
};

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

const VehicleDetailsModal: React.FC<VehicleDetailsModalProps> = ({
  open,
  onClose,
  vehicle,
  onAlertUpdate,
}) => {
  if (!vehicle) return null;

  const [tabIndex, setTabIndex] = useState(0);
  const [alertHistory, setAlertHistory] = useState(vehicle.alertHistory);

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
          <Tab label="Trips" />
          <Tab label="Fuel Logs" />
          <Tab label="Alert History" />
          <Tab label="Maintenance Logs" />
          <Tab label="Documents" />
        </Tabs>

        {/* Basic Details */}
        <TabPanel value={tabIndex} index={0}>
          <Box display="flex" flexDirection="column" gap={1}>
            <Typography>Vehicle Number: {vehicle.vehicleNumber}</Typography>
            <Typography>Type: {vehicle.type}</Typography>
            <Typography>
              Make / Model: {vehicle.make} {vehicle.model}
            </Typography>
            <Typography>
              Fuel: <FuelTypeBadge fuelType={vehicle.fuelType} />
            </Typography>
            <Typography>
              Status: <StatusWithIcon status={vehicle.status} />
            </Typography>
            <Typography sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              Location:
              <IconButton size="large" title="View on Map" sx={{ p: 0.5 }}>
                <MapIcon fontSize="medium" />
              </IconButton>
              {vehicle.location}
            </Typography>
            {vehicle.images.length > 0 && (
              <Box sx={{ pb: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  Vehicle Images:
                </Typography>
                <Slider
                  dots
                  infinite
                  speed={500}
                  slidesToShow={1}
                  slidesToScroll={1}
                  arrows={false}
                >
                  {vehicle.images.map((src, i) => (
                    <Box key={i}>
                      <img
                        src={src}
                        alt={`Vehicle image ${i + 1}`}
                        style={{
                          width: "100%",
                          height: 300,
                          objectFit: "contain",
                        }}
                      />
                    </Box>
                  ))}
                </Slider>
              </Box>
            )}
          </Box>
        </TabPanel>

        {/* Trips */}
        <TabPanel value={tabIndex} index={1}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            🚗 Trip Summary (Last 30 Days)
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2">
              Total Trips: {vehicle.trips.length}
            </Typography>
            <Typography variant="body2">
              Total Distance:{" "}
              {vehicle.trips.reduce((acc, t) => acc + t.distance, 0).toFixed(1)}{" "}
              km
            </Typography>
            <Typography variant="body2">
              Total Duration:{" "}
              {(
                vehicle.trips.reduce((acc, t) => acc + t.duration, 0) / 60
              ).toFixed(1)}{" "}
              mins
            </Typography>
            <Typography variant="body2">
              Avg. Mileage:{" "}
              {(
                vehicle.trips.reduce((acc, t) => acc + t.distance, 0) /
                (vehicle.fuelLogs.reduce((acc, f) => acc + f.amount, 0) || 1)
              ).toFixed(1)}{" "}
              km/L
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ⏳ Only trips from the last 30 days are shown
            </Typography>
          </Box>

          {vehicle.trips.length > 0 ? (
            <Box
              sx={{
                maxHeight: 300,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
                pr: 1,
              }}
            >
              {vehicle.trips.map((trip, i) => (
                <Box
                  key={i}
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 2,
                    backgroundColor: "#f4f4f4",
                    borderLeft: `4px solid #27ae60`,
                    p: 1.5,
                    borderRadius: 1,
                    boxShadow: 1,
                  }}
                >
                  <Box sx={{ fontSize: 24 }}>🧭</Box>
                  <Box flex={1}>
                    <Typography sx={{ fontWeight: 500 }}>
                      {trip.from} ➝ {trip.to}
                    </Typography>
                    <Typography variant="body2">
                      {trip.distance} km | {(trip.duration / 60).toFixed(1)}{" "}
                      mins
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      📅 {new Date(trip.date).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <Box
              sx={{
                backgroundColor: "#2ecc71",
                color: "#fff",
                px: 2,
                py: 1,
                borderRadius: 1,
                width: "fit-content",
                mt: 1,
              }}
            >
              ✅ No Trips Recorded
            </Box>
          )}
        </TabPanel>

        {/* Fuel Logs */}
        <TabPanel value={tabIndex} index={2}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            ⛽ Fuel Logs Summary (Last 30 Days)
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2">
              Total Fills: {vehicle.fuelLogs.length}
            </Typography>
            <Typography variant="body2">
              Total Fuel:{" "}
              {vehicle.fuelLogs.reduce((acc, f) => acc + f.amount, 0)} L
            </Typography>
            <Typography variant="body2">
              Total Cost: ₹
              {vehicle.fuelLogs.reduce((acc, f) => acc + f.cost, 0)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ⏳ Only logs from the last 30 days are shown
            </Typography>
          </Box>

          {vehicle.fuelLogs.length > 0 ? (
            <Box
              sx={{
                maxHeight: 300,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
                pr: 1,
              }}
            >
              {vehicle.fuelLogs.map((log, i) => (
                <Box
                  key={i}
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 2,
                    backgroundColor: "#f4f4f4",
                    borderLeft: `4px solid #2980b9`,
                    p: 1.5,
                    borderRadius: 1,
                    boxShadow: 1,
                  }}
                >
                  <Box sx={{ fontSize: 24 }}>⛽</Box>
                  <Box flex={1}>
                    <Typography sx={{ fontWeight: 500 }}>
                      Filled {log.amount} L – ₹{log.cost}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      📅 {new Date(log.date).toLocaleString()}
                    </Typography>
                    {log.location && (
                      <Typography
                        variant="body2"
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <IconButton
                          size="small"
                          title="View on Map"
                          sx={{ p: 0.2 }}
                        >
                          <MapIcon fontSize="small" />
                        </IconButton>
                        Location
                      </Typography>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <Box
              sx={{
                backgroundColor: "#2ecc71",
                color: "#fff",
                px: 2,
                py: 1,
                borderRadius: 1,
                width: "fit-content",
                mt: 1,
              }}
            >
              ✅ No Fuel Logs
            </Box>
          )}
        </TabPanel>

        {/* Alert History */}
        <TabPanel value={tabIndex} index={3}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            🚨 Alert Summary (Last 30 Days)
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2">
              Unhandled Alerts: {alertHistory.filter((a) => a.unhandled).length}
            </Typography>
            <Typography variant="body2">
              Total Alerts: {alertHistory.length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ⏳ Only alerts from the last 30 days are shown
            </Typography>
          </Box>

          {alertHistory.some((a) => a.unhandled) && (
            <Button
              variant="contained"
              size="small"
              color="primary"
              onClick={() => {
                const updated = alertHistory.map((a) =>
                  a.unhandled ? { ...a, unhandled: false } : a
                );
                setAlertHistory(updated);
                onAlertUpdate?.(vehicle.id, updated);
                // await api.markAllAlertsHandled(vehicle.id);
              }}
              sx={{ mb: 2, alignSelf: "flex-start" }}
            >
              Handle All Alerts
            </Button>
          )}

          {alertHistory.length > 0 ? (
            <Box
              sx={{
                maxHeight: 300,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
                pr: 1,
              }}
            >
              {alertHistory.map((alert, i) => {
                const { type, time, location, unhandled } = alert;
                const { icon, color } = ALERT_MAP[type.toLowerCase()] || {
                  icon: "⚠️",
                  color: "#7f8c8d",
                };

                const handleMarkAsHandled = () => {
                  const updated = [...alertHistory];
                  updated[i] = { ...alert, unhandled: false };
                  setAlertHistory(updated);
                  onAlertUpdate?.(vehicle.id, updated);
                  // await api.markAlertHandled(alert.id);
                };

                return (
                  <Box
                    key={i}
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 2,
                      backgroundColor: "#f4f4f4",
                      borderLeft: `4px solid ${color}`,
                      p: 1.5,
                      borderRadius: 1,
                      boxShadow: 1,
                    }}
                  >
                    <Box sx={{ fontSize: 24 }}>{icon}</Box>
                    <Box flex={1} gap={1}>
                      <Typography
                        sx={{ fontWeight: 500, textTransform: "capitalize" }}
                      >
                        {type} -{" "}
                        <span
                          style={{ color: unhandled ? "#e74c3c" : "#2ecc71" }}
                        >
                          {unhandled ? "Unhandled" : "Resolved"}
                        </span>
                      </Typography>

                      <Typography variant="caption" color="text.secondary">
                        📅 {new Date(time).toLocaleString()}
                      </Typography>

                      {location && (
                        <Typography
                          variant="body2"
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <IconButton
                            size="small"
                            title="View on Map"
                            sx={{ p: 0.2 }}
                          >
                            <MapIcon fontSize="small" />
                          </IconButton>
                          Location
                        </Typography>
                      )}

                      {unhandled && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={handleMarkAsHandled}
                          sx={{ mt: 1 }}
                        >
                          Mark as Handled
                        </Button>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          ) : (
            <Box
              sx={{
                backgroundColor: "#2ecc71",
                color: "#fff",
                px: 2,
                py: 1,
                borderRadius: 1,
                width: "fit-content",
                mt: 1,
              }}
            >
              ✅ No Alerts
            </Box>
          )}
        </TabPanel>

        {/* Maintenance Logs */}
        <TabPanel value={tabIndex} index={4}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            🛠️ Maintenance Summary (Last 30 Days)
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2">
              Total Maintenance Entries: {vehicle.maintenanceLogs?.length ?? 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ⏳ Only logs from the last 30 days are shown
            </Typography>
          </Box>

          {vehicle.maintenanceLogs?.length > 0 ? (
            <Box
              sx={{
                maxHeight: 300,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
                pr: 1,
              }}
            >
              {vehicle.maintenanceLogs.map((log, i) => (
                <Box
                  key={i}
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 2,
                    backgroundColor: "#f4f4f4",
                    borderLeft: `4px solid #8e44ad`,
                    p: 1.5,
                    borderRadius: 1,
                    boxShadow: 1,
                  }}
                >
                  <Box sx={{ fontSize: 24 }}>🛠️</Box>
                  <Box flex={1}>
                    <Typography sx={{ fontWeight: 500 }}>
                      {log.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      📅 {new Date(log.date).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <Box
              sx={{
                backgroundColor: "#2ecc71",
                color: "#fff",
                px: 2,
                py: 1,
                borderRadius: 1,
                width: "fit-content",
                mt: 1,
              }}
            >
              ✅ No Maintenance Logs
            </Box>
          )}
        </TabPanel>

        {/* Documents */}
        <TabPanel value={tabIndex} index={5}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            📄 Vehicle Documents
          </Typography>

          <Box display="flex" flexDirection="column" gap={1.5}>
            {/* RC */}
            <Box
              sx={{
                backgroundColor: "#f4f4f4",
                borderLeft: `4px solid #2980b9`,
                p: 1.5,
                borderRadius: 1,
                boxShadow: 1,
              }}
            >
              <Typography sx={{ fontWeight: 500 }}>
                RC Number: {vehicle.documents.rcNumber}
              </Typography>
              <Typography variant="body2">
                Expiry Date:{" "}
                {new Date(vehicle.documents.rcExpiry).toLocaleDateString()}
              </Typography>
            </Box>

            {/* Fitness */}
            <Box
              sx={{
                backgroundColor: "#f4f4f4",
                borderLeft: `4px solid #8e44ad`,
                p: 1.5,
                borderRadius: 1,
                boxShadow: 1,
              }}
            >
              <Typography sx={{ fontWeight: 500 }}>
                Fitness Certificate
              </Typography>
              <Typography variant="body2">
                Expiry Date:{" "}
                {new Date(vehicle.documents.fitnessExpiry).toLocaleDateString()}
              </Typography>
            </Box>

            {/* PUCC */}
            <Box
              sx={{
                backgroundColor: "#f4f4f4",
                borderLeft: `4px solid #16a085`,
                p: 1.5,
                borderRadius: 1,
                boxShadow: 1,
              }}
            >
              <Typography sx={{ fontWeight: 500 }}>PUCC</Typography>
              <Typography variant="body2">
                Expiry Date:{" "}
                {new Date(vehicle.documents.puccExpiry).toLocaleDateString()}
              </Typography>
            </Box>

            {/* Insurance */}
            <Box
              sx={{
                backgroundColor: "#f4f4f4",
                borderLeft: `4px solid #d35400`,
                p: 1.5,
                borderRadius: 1,
                boxShadow: 1,
              }}
            >
              <Typography sx={{ fontWeight: 500 }}>Insurance</Typography>
              <Typography variant="body2">
                Expiry Date:{" "}
                {new Date(
                  vehicle.documents.insuranceExpiry
                ).toLocaleDateString()}
              </Typography>
            </Box>
          </Box>

          {/* 🔗 Optional Links (With Placeholder) */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              📎 Available Document Files
            </Typography>

            <Box display="flex" flexDirection="column" gap={1}>
              {[
                {
                  name: "Registration Certificate",
                  url: vehicle.documents.rcDocUrl,
                },
                { name: "Insurance", url: vehicle.documents.insuranceDocUrl },
                {
                  name: "Fitness Certificate",
                  url: vehicle.documents.fitnessDocUrl,
                },
                { name: "PUCC", url: vehicle.documents.puccDocUrl },
                {
                  name: "Vehicle Invoice",
                  url: vehicle.documents.invoiceDocUrl,
                },
              ].map((doc, i) => (
                <Box
                  key={i}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    backgroundColor: "#f4f4f4",
                    p: 1,
                    borderRadius: 1,
                    boxShadow: 1,
                  }}
                >
                  <Typography sx={{ fontWeight: 500 }}>{doc.name}:</Typography>
                  {doc.url ? (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#2980b9", textDecoration: "underline" }}
                    >
                      View Document
                    </a>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No File Uploaded
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          </Box>
        </TabPanel>
      </DialogContent>
    </Dialog>
  );
};

// --------------------------------------------
// ✅ Utility Components
// --------------------------------------------
const badgeBaseStyle = {
  color: "white",
  padding: "2px 6px",
  borderRadius: "12px",
  fontSize: "12px",
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
};

const FuelTypeBadge = ({ fuelType }: { fuelType?: string }) => {
  const fuelMap: Record<string, { icon: string; color: string }> = {
    petrol: { icon: "⛽", color: "#3498db" },
    diesel: { icon: "🛢️", color: "#34495e" },
    ev: { icon: "🔋", color: "#27ae60" },
    hybrid: { icon: "⚡", color: "#8e44ad" },
  };
  const key = fuelType?.toLowerCase() ?? "";
  const { icon, color } = fuelMap[key] || { icon: "❓", color: "#7f8c8d" };
  return (
    <span style={{ ...badgeBaseStyle, backgroundColor: color }}>
      {icon} {fuelType}
    </span>
  );
};

const StatusWithIcon = ({ status }: { status?: string }) => {
  const record = useRecordContext<{ status?: string }>();
  const effectiveStatus = status ?? record?.status;
  const statusMap: Record<string, { icon: string; color: string }> = {
    active: { icon: "🟢", color: "#2ecc71" },
    idle: { icon: "🟡", color: "#f1c40f" },
    offline: { icon: "🔴", color: "#e74c3c" },
  };
  const { icon, color } = statusMap[effectiveStatus?.toLowerCase() ?? ""] || {
    icon: "⚪",
    color: "#bdc3c7",
  };
  return (
    <span style={{ ...badgeBaseStyle, backgroundColor: color }}>
      {icon} {effectiveStatus}
    </span>
  );
};

const AlertsWithBadges = () => {
  const record = useRecordContext<Vehicle>();
  const alerts = record?.alertHistory?.filter((a) => a?.unhandled) || [];
  const MAX_VISIBLE_ALERTS = 2;

  return (
    <span style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
      {alerts.length > 0 ? (
        <>
          {alerts.slice(0, MAX_VISIBLE_ALERTS).map((a, i) => {
            const { icon, color } = ALERT_MAP[a.type.toLowerCase()] || {
              icon: "⚠️",
              color: "#7f8c8d",
            };

            return (
              <span
                key={i}
                style={{ ...badgeBaseStyle, backgroundColor: color }}
              >
                {icon} {a.type}
              </span>
            );
          })}
          {alerts.length > MAX_VISIBLE_ALERTS && (
            <span
              style={{ ...badgeBaseStyle, backgroundColor: "#95a5a6" }}
              title={alerts
                .slice(MAX_VISIBLE_ALERTS)
                .map((a) => a.type)
                .join(", ")}
            >
              +{alerts.length - MAX_VISIBLE_ALERTS} more
            </span>
          )}
        </>
      ) : (
        <span style={{ ...badgeBaseStyle, backgroundColor: "#2ecc71" }}>
          ✅ No Alerts
        </span>
      )}
    </span>
  );
};

const LocationWithLink = () => {
  const record = useRecordContext<Vehicle>();
  return record ? (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <IconButton title="View on Map">
        <MapIcon />
      </IconButton>
      <span>{record.location}</span>
    </Box>
  ) : null;
};

// --------------------------------------------
// ✅ Table Component
// --------------------------------------------
const VehicleTable: React.FC = () => {
  const { page, perPage, data, isLoading } = useListContext<Vehicle>();
  const [open, setOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const handleRowClick = (id: string | number | undefined) => {
    const vehicle = data?.find((v) => v.id === id) || null;
    setSelectedVehicle(vehicle);
    setOpen(true);
  };

  const handleAlertUpdate = (
    vehicleId: number,
    updatedAlerts: VehicleAlert[]
  ) => {
    if (selectedVehicle?.id === vehicleId) {
      setSelectedVehicle({ ...selectedVehicle, alertHistory: updatedAlerts });
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
            record.mainImage ? (
              <img
                src={record.mainImage}
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
        <TextField source="vehicleNumber" />
        <FunctionField
          label="Make / Model"
          render={(record) => `${record.make} ${record.model}`}
        />
        <FunctionField
          label="Status"
          render={(record) => <StatusWithIcon status={record.status} />}
        />
        <FunctionField label="Alerts" render={() => <AlertsWithBadges />} />
        <FunctionField label="Location" render={() => <LocationWithLink />} />
      </Datagrid>
      <Pagination />
      <VehicleDetailsModal
        key={selectedVehicle?.id}
        open={open}
        onClose={() => setOpen(false)}
        vehicle={selectedVehicle}
        onAlertUpdate={handleAlertUpdate}
      />
    </>
  );
};

// --------------------------------------------
// ✅ Final Component
// --------------------------------------------
type VehiclesTableProps = { resource: string };
const VehiclesTableSimple: React.FC<VehiclesTableProps> = ({ resource }) => (
  <ListBase
    resource={resource}
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

export default VehiclesTableSimple;
