import { useRecordContext } from "react-admin";
import { Box, IconButton } from "@mui/material";
import type { Vehicle } from "./types-vehicles";
import { BADGE_BASE_STYLE, ALERT_MAP } from "./constants";
import MapIcon from "@mui/icons-material/Map";

// --------------------------------------------
// ✅ Utility Components
// --------------------------------------------
export const FuelTypeBadge = ({ fuelType }: { fuelType?: string }) => {
  const fuelMap: Record<string, { icon: string; color: string }> = {
    petrol: { icon: "⛽", color: "#3498db" },
    diesel: { icon: "🛢️", color: "#34495e" },
    ev: { icon: "🔋", color: "#27ae60" },
    hybrid: { icon: "⚡", color: "#8e44ad" },
  };
  const key = fuelType?.toLowerCase() ?? "";
  const { icon, color } = fuelMap[key] || { icon: "❓", color: "#7f8c8d" };
  return (
    <span style={{ ...BADGE_BASE_STYLE, backgroundColor: color }}>
      {icon} {fuelType}
    </span>
  );
};

export const StatusWithIcon = ({ status }: { status?: string }) => {
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
    <span style={{ ...BADGE_BASE_STYLE, backgroundColor: color }}>
      {icon} {effectiveStatus}
    </span>
  );
};

export const AlertsWithBadges = () => {
  const record = useRecordContext<Vehicle>();
  const alerts =
    record?.device?.structuredTrackingData?.alerts?.list || [];
  const MAX_VISIBLE_ALERTS = 2;

  return (
    <span style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
      {alerts.length > 0 ? (
        <>
          {alerts.slice(0, MAX_VISIBLE_ALERTS).map((a, i) => {
            const { icon, color } = ALERT_MAP[a.message.toLowerCase()] || {
              icon: "⚠️",
              color: "#7f8c8d",
            };

            return (
              <span
                key={i}
                style={{ ...BADGE_BASE_STYLE, backgroundColor: color }}
              >
                {icon} {a.message}
              </span>
            );
          })}
          {alerts.length > MAX_VISIBLE_ALERTS && (
            <span
              style={{ ...BADGE_BASE_STYLE, backgroundColor: "#95a5a6" }}
              title={alerts
                .slice(MAX_VISIBLE_ALERTS)
                .map((a) => a.message)
                .join(", ")}
            >
              +{alerts.length - MAX_VISIBLE_ALERTS} more
            </span>
          )}
        </>
      ) : (
        <span style={{ ...BADGE_BASE_STYLE, backgroundColor: "#2ecc71" }}>
          ✅ No Alerts
        </span>
      )}
    </span>
  );
};

export const LocationWithLink = () => {
  const record = useRecordContext<Vehicle>();
  return record ? (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <IconButton title="View on Map">
        <MapIcon />
      </IconButton>
      <span>
        {(record.device?.structuredTrackingData?.locs?.lat || "0.00000") +
          ", " +
          (record.device?.structuredTrackingData?.locs?.lng || "0.00000")}
      </span>
    </Box>
  ) : null;
};
