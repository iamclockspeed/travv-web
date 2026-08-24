import { useState } from "react";
import { Box, Typography, IconButton } from "@mui/material";
import type { Vehicle } from "../types-vehicles";
import { ALERT_MAP } from "../constants";
import MapIcon from "@mui/icons-material/Map";

interface Props {
  vehicle: Vehicle;
}

/* Alerts History */
const AlertsHistoryTab: React.FC<Props> = ({ vehicle }) => {
  const [alertHistory] = useState(vehicle.device.alertHistory || []);

  return (
    <>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        🚨 Total Alerts: {alertHistory.length}
      </Typography>
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" color="text.secondary">
          ⏳ Only alerts from the last 7 days are shown
        </Typography>
      </Box>

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
            const { ts, locs, message } = alert;
            const { icon, color } = ALERT_MAP[message.toLowerCase()] || {
              icon: "⚠️",
              color: "#7f8c8d",
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
                    {message}
                  </Typography>

                  <Typography variant="caption" color="text.secondary">
                    📅 {new Date(ts).toLocaleString()}
                  </Typography>

                  {locs && (
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
