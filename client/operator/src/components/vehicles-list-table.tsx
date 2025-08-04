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
  mainImage: string;
  images: string[];
}

interface VehicleAlert {
  type: string;
  time: string;
  location: string;
  unhandled: boolean;
}

interface VehicleDetailsModalProps {
  open: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
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
            label="Vehicle Number / Class"
            source="vehicleNumber"
            alwaysOn
            key="vehicleNumber"
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
const TabPanel = ({ children, value, index }: any) => {
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
}) => {
  if (!vehicle) return null;

  const [tabIndex, setTabIndex] = useState(0);
  const [alertHistory, setAlertHistory] = useState(vehicle?.alertHistory || []);

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
              <IconButton
                size="large"
                onClick={() =>
                  window.open(
                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      vehicle.location
                    )}`,
                    "_blank"
                  )
                }
                title="View on Map"
                sx={{ p: 0.5 }}
              >
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
                        alt={`Gallery ${i + 1}`}
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
          <Typography>Trips for vehicle #{vehicle.vehicleNumber}</Typography>
          <ul>
            <li>Trip #1: Origin → Destination (Date)</li>
            <li>Trip #2: Origin → Destination (Date)</li>
          </ul>
        </TabPanel>

        {/* Fuel Logs */}
        <TabPanel value={tabIndex} index={2}>
          <Typography>Fuel Logs</Typography>
          <ul>
            <li>2024-06-12: ⛽ 40L filled - ₹3200</li>
            <li>2024-06-20: ⛽ 35L filled - ₹2900</li>
          </ul>
        </TabPanel>

        {/* Alert History */}
        <TabPanel value={tabIndex} index={3}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            🚨 Alert Summary (Last 30 Days)
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2">
              Total Alerts: {alertHistory.length}
            </Typography>
            <Typography variant="body2">
              Unhandled Alerts: {alertHistory.filter((a) => a.unhandled).length}
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

                // Optional API
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

                  // Optional: call API here
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
                            onClick={() =>
                              window.open(
                                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                  location
                                )}`,
                                "_blank"
                              )
                            }
                            title="View on Map"
                            sx={{ p: 0.2 }}
                          >
                            <MapIcon fontSize="small" />
                          </IconButton>
                          View on Map
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
          <Typography>Maintenance Logs</Typography>
          <ul>
            <li>2024-05-30: Oil Change</li>
            <li>2024-06-15: Tyre Replacement</li>
          </ul>
        </TabPanel>

        {/* Documents */}
        <TabPanel value={tabIndex} index={5}>
          <Typography>Documents</Typography>
          <ul>
            <li>
              <a href="/docs/rc.pdf" target="_blank" rel="noopener noreferrer">
                Registration Certificate
              </a>
            </li>
            <li>
              <a
                href="/docs/insurance.pdf"
                target="_blank"
                rel="noopener noreferrer"
              >
                Insurance
              </a>
            </li>
          </ul>
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

  if (isLoading) return <p>Loading...</p>;
  if (!data) return <p>No data</p>;

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
        <FunctionField label="Status" render={() => <StatusWithIcon />} />
        <FunctionField label="Alerts" render={() => <AlertsWithBadges />} />
        <FunctionField label="Location" render={() => <LocationWithLink />} />
      </Datagrid>
      <Pagination />
      <VehicleDetailsModal
        open={open}
        onClose={() => setOpen(false)}
        key={selectedVehicle?.id}
        vehicle={selectedVehicle}
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
