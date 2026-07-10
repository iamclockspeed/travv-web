// --------------------------------------------
// ✅ Constants
// --------------------------------------------
export const BADGE_BASE_STYLE = {
  color: "white",
  padding: "2px 6px",
  borderRadius: "12px",
  fontSize: "12px",
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
};

export const ALERT_MAP: Record<string, { icon: string; color: string }> = {
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
