import L from "leaflet";
import logo from "../../assets/logo.png";
import { ALERT_MAP } from "../vehicles_list/constants";

// ─── Leaflet default-icon fix ─────────────────────────────────────────────
// Leaflet's default marker icon paths break under most bundlers; this patches
// them to load from a CDN instead. Only needs to run once per app load.
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)
  ._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export const makeStopIcon = (label: string, color: string) =>
  L.divIcon({
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `<div style="
      width:28px;height:28px;border-radius:50%;
      background:${color};border:3px solid #fff;
      box-shadow:0 0 10px ${color}99,0 2px 6px #0006;
      display:flex;align-items:center;justify-content:center;
      font-size:10px;font-weight:800;color:#111;font-family:monospace;
    ">${label}</div>`,
  });

export const makeAlertIcon = (alertType: string) => {
  const { icon, color } = ALERT_MAP[alertType.toLowerCase()] || {
    icon: "⚠️",
    color: "#7f8c8d",
  };

  return L.divIcon({
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `<div style="
      width:28px;height:28px;border-radius:50%;
      background:${color};border:3px solid #fff;
      box-shadow:0 0 10px ${color}99,0 2px 6px #0006;
      display:flex;align-items:center;justify-content:center;
      font-size:10px;font-weight:800;color:#111;font-family:monospace;
    ">${icon}</div>`,
  });
};

/**
 * Bus marker icon.
 * selected=true  → larger, pulsing purple ring
 * selected=false → smaller, plain white ring
 */
export const makeVehicleIcon = (selected: boolean, vehicleStatus: string) =>
  L.divIcon({
    className: "",
    iconSize: [selected ? 36 : 28, selected ? 36 : 28],
    iconAnchor: [selected ? 18 : 14, selected ? 18 : 14],
    html: `
    <div style="
      border: ${selected ? (vehicleStatus !== "offline" ? "2px solid #7E59E8" : "1px solid white") : "1px solid white"};
      width:${selected ? 36 : 28}px;
      height:${selected ? 36 : 28}px;
      border-radius:50%;
      overflow:hidden;
      animation:${vehicleStatus !== "offline" ? "vPulse 1.4s ease-in-out infinite" : "none"};
    ">
      <img src=${logo} alt="Bus" style="width:100%;height:100%;" />
    </div>
    <style>
      @keyframes vPulse {
        0%,100%{box-shadow:0 0 0 8px #45317b48,0 0 16px #44307C}
        50%{box-shadow:0 0 0 16px #6a4ac032,0 0 24px #7552d4}
      }
    </style>`,
  });
