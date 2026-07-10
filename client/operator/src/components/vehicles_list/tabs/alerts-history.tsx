import { useState } from "react";
import { Button } from "react-admin";
import { Box, Typography, IconButton } from "@mui/material";
import type { Vehicle, VehicleAlert } from "../types-vehicles";
import { ALERT_MAP } from "../constants";
import MapIcon from "@mui/icons-material/Map";

interface Props {
  vehicle: Vehicle;
  onAlertUpdate?: (vehicleId: number, alert: VehicleAlert[]) => void;
}

/* Alerts History */
const AlertsHistoryTab: React.FC<Props> = ({ vehicle, onAlertUpdate }) => {
  const [alertHistory, setAlertHistory] = useState(
    vehicle.device.structuredTrackingData?.safety?.alerts
      ? vehicle.device.structuredTrackingData.safety.alerts
      : [],
  );

  return (
    <>
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
                    <span style={{ color: unhandled ? "#e74c3c" : "#2ecc71" }}>
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
    </>
  );
};

export default AlertsHistoryTab;
