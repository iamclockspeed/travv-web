import { useState } from "react";
import { Button } from "react-admin";
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  Tabs,
  Tab,
  Typography,
  IconButton,
} from "@mui/material";
import Slider from "react-slick";
import type { VehicleDetailsModalProps, TabPanelProps } from "./types-vehicles";
import { FuelTypeBadge, StatusWithIcon } from "./utilities";
import { ALERT_MAP } from "./constants";
import CloseIcon from "@mui/icons-material/Close";
import MapIcon from "@mui/icons-material/Map";

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
  onAlertUpdate,
}) => {
  if (!vehicle) return null;

  const [tabIndex, setTabIndex] = useState(0);
  const [alertHistory, setAlertHistory] = useState(
    vehicle.device.structuredTrackingData?.safety?.alerts
      ? vehicle.device.structuredTrackingData.safety.alerts
      : [],
  );

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
          {/* <Tab label="Fuel Logs" /> */}
          <Tab label="Alert History" />
          {/* <Tab label="Maintenance Logs" /> */}
          <Tab label="Documents" />
        </Tabs>

        {/* Basic Details */}
        <TabPanel value={tabIndex} index={0}>
          <Box display="flex" flexDirection="column" gap={1}>
            <Typography>
              Vehicle Number: {vehicle.registrationNumber}
            </Typography>
            <Typography>Type: {vehicle.type}</Typography>
            <Typography>
              Make / Model: {vehicle.make} {vehicle.model}
            </Typography>
            <Typography>
              Fuel: <FuelTypeBadge fuelType={vehicle.fuelType} />
            </Typography>
            <Typography>
              Status:{" "}
              <StatusWithIcon
                status={vehicle.device?.structuredTrackingData?.status}
              />
            </Typography>
            <Typography sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              Location:
              <IconButton size="large" title="View on Map" sx={{ p: 0.5 }}>
                <MapIcon fontSize="medium" />
              </IconButton>
              {(vehicle.device?.structuredTrackingData?.locs?.lat ||
                "0.00000") +
                ", " +
                (vehicle.device?.structuredTrackingData?.locs?.lng ||
                  "0.00000")}
            </Typography>
            {vehicle.images.length > 0 && (
              <Box sx={{ pb: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  Vehicle Images:
                </Typography>
                <Slider
                  dots
                  infinite={vehicle.images.length > 1}
                  speed={500}
                  slidesToShow={1}
                  slidesToScroll={1}
                  arrows={false}
                >
                  {vehicle.images.map((src, i) => (
                    <Box key={i}>
                      <img
                        src={import.meta.env.VITE_BACKEND_HOST + src.url}
                        alt={`${src.description}`}
                        title={`${src.description}`}
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
        {/* <TabPanel value={tabIndex} index={1}>
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
        </TabPanel> */}

        {/* Fuel Logs */}
        {/* <TabPanel value={tabIndex} index={2}>
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
        </TabPanel> */}

        {/* Alert History */}
        <TabPanel value={tabIndex} index={2}>
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
                  a.unhandled ? { ...a, unhandled: false } : a,
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
        {/* <TabPanel value={tabIndex} index={4}>
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
        </TabPanel> */}

        {/* Documents */}
        <TabPanel value={tabIndex} index={3}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            📄 Vehicle Documents
          </Typography>

          <Box display="flex" flexDirection="column" gap={1.5}>
            {vehicle.documents.length > 0 ? (
              vehicle.documents.map((item) => (
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
                    {item.type} Number: {item.number}
                  </Typography>
                  <Typography variant="body2">
                    Expiry Date:{" "}
                    {new Date(item.expiryDate).toLocaleDateString()}
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                No Data Provided
              </Typography>
            )}
          </Box>

          {/* 🔗 Optional Links (With Placeholder) */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              📎 Available Document Files
            </Typography>

            <Box display="flex" flexDirection="column" gap={1}>
              {vehicle.documents.length > 0 ? (
                vehicle.documents.map((doc, i) => (
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
                    <Typography sx={{ fontWeight: 500 }}>
                      {doc.type}:
                    </Typography>
                    {doc.url ? (
                      <a
                        href={import.meta.env.VITE_BACKEND_HOST + doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "#2980b9",
                          textDecoration: "underline",
                        }}
                      >
                        View Document
                      </a>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No File Uploaded
                      </Typography>
                    )}
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No Documents Uploaded
                </Typography>
              )}
            </Box>
          </Box>
        </TabPanel>
      </DialogContent>
    </Dialog>
  );
};
