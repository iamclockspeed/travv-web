import { Box, Typography } from "@mui/material";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
} from "recharts";

import type { Vehicle } from "../types-vehicles";

interface Props {
  vehicle: Vehicle;
}

const TripsTab: React.FC<Props> = ({ vehicle }) => {
  const tripData = [
    { day: "Mon", distance: 42 },
    { day: "Tue", distance: 68 },
    { day: "Wed", distance: 51 },
    { day: "Thu", distance: 85 },
    { day: "Fri", distance: 73 },
    { day: "Sat", distance: 96 },
    { day: "Sun", distance: 54 },
  ];

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        🚗 Trip Summary (Last 7 Days)
      </Typography>

      <Box sx={{ width: "100%", height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={tripData}
            margin={{
              top: 25,
              right: 30,
              left: 30,
              bottom: 10,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="day" />

            {/* <YAxis
              label={{
                value: "Distance (km)",
                angle: -90,
                position: "insideLeft",
              }}
            /> */}

            <Line
              type="monotone"
              dataKey="distance"
              stroke="#1976d2"
              strokeWidth={3}
              dot={{ r: 5 }}
              activeDot={{ r: 7 }}
            >
              <LabelList
                dataKey="distance"
                position="top"
                formatter={(value) => `${value} km`}
              />
            </Line>
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default TripsTab;
