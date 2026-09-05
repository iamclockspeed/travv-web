import React from "react";
import { Box, Typography } from "@mui/material";

import type { RoutePoint, StopStatus } from "./types";
import { formatKm } from "./utils";

export interface StopItemProps {
  stop: RoutePoint;
  index: number;
  status: StopStatus;
  isFirst: boolean;
  isLast: boolean;
  cumulativeDistance: number;
  nextStopLen: number;
  maxStopLen: number;
  vehicleProjection: number;
  onClick: () => void;
}

const StopItem: React.FC<StopItemProps> = ({
  stop,
  index,
  status,
  isFirst,
  isLast,
  cumulativeDistance,
  nextStopLen,
  maxStopLen,
  vehicleProjection,
  onClick,
}) => {
  const stopColor = status === "upcoming" ? "white" : "#44307c";
  const stopBorderColor = status === "passed" ? "white" : "#7E59E8";

  const scale = Math.round(200 / Math.max(maxStopLen, 0.001));
  const nextStopLenInPx = Math.round(nextStopLen * scale);
  const cumulativeLenInPx = Math.round(cumulativeDistance * scale);
  const vehicleProjectionInPx = Math.round(vehicleProjection * scale);
  const remainKmToStop = Math.max(
    cumulativeDistance + nextStopLen - vehicleProjection,
    0,
  );
  const progressVisible =
    vehicleProjectionInPx > cumulativeLenInPx && remainKmToStop > 0;

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "1fr 3fr 1fr",
        gap: 1,
        height: `${nextStopLenInPx}px`,
      }}
    >
      <Box />
      <Box
        onClick={onClick}
        sx={{
          display: "flex",
          gap: 1.5,
          cursor: "pointer",
          bgcolor: "#fff",
          position: "relative",
          minHeight: 100,
        }}
      >
        {/* Track background */}
        {!isLast && (
          <Box
            sx={{
              position: "absolute",
              left: "8px",
              top: 0,
              bottom: 0,
              width: "4px",
              bgcolor: "#7E59E8",
            }}
          />
        )}
        {/* Track covered */}
        {!isLast && (
          <Box
            sx={{
              position: "absolute",
              left: "8px",
              top: 0,
              height: `${vehicleProjectionInPx - cumulativeLenInPx}px`,
              width: "4px",
              bgcolor: "#44307c",
            }}
          />
        )}
        {/* Bracket */}
        {!isLast && vehicleProjectionInPx > cumulativeLenInPx && (
          <Box
            sx={{
              position: "absolute",
              left: "-8px",
              top: 0,
              height: `${vehicleProjectionInPx - cumulativeLenInPx}px`,
              width: "8px",
              border: "1px solid #44307c",
              borderRight: "none",
            }}
          />
        )}

        {/* Stop dot */}
        <Box sx={{ flexShrink: 0, zIndex: 1, position: "relative" }}>
          <Box
            sx={{
              width: 20,
              height: 20,
              bgcolor: stopColor,
              border: `2px solid ${stopBorderColor}`,
              transition: "all 0.3s",
              ...(isFirst || isLast
                ? { rotate: "45deg" }
                : { borderRadius: "50%" }),
            }}
          />
          {status !== "upcoming" && (
            <Box
              sx={{
                position: "absolute",
                left: "5px",
                top: "2px",
                color: "white",
                fontSize: 12,
              }}
            >
              ✔
            </Box>
          )}
        </Box>

        {/* Labels */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="caption"
            sx={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.1em",
              display: "block",
            }}
          >
            S-{index + 1} ({formatKm(cumulativeDistance)})
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontSize: 11,
              fontWeight: 800,
              lineHeight: 1.45,
              wordBreak: "break-word",
              mt: 0.25,
            }}
          >
            {stop.name || `Station ${index + 1}`}
          </Typography>
          {progressVisible && (
            <>
              <Typography
                variant="body2"
                sx={{ fontSize: 11, lineHeight: 1.45, mt: 0.25 }}
              >
                Travelled {formatKm(vehicleProjection)}
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontSize: 11, lineHeight: 1.45, mt: 0.25 }}
              >
                Next Stop {formatKm(remainKmToStop)}
              </Typography>
            </>
          )}
        </Box>
      </Box>
      <Box />
    </Box>
  );
};

export default StopItem;
