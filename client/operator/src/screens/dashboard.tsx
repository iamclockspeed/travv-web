import { useNavigate } from "react-router-dom";
import { useDataProvider } from "react-admin";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, Box, Typography, Grid } from "@mui/material";
import { DashCard } from "../components/custom-uis";
import TimeToLeaveIcon from "@mui/icons-material/TimeToLeave";
import AccessTimeFilledIcon from "@mui/icons-material/AccessTimeFilled";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import SpeedIcon from "@mui/icons-material/Speed";
import WrongLocationIcon from "@mui/icons-material/WrongLocation";
import CarCrashIcon from "@mui/icons-material/CarCrash";
// import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
// import HandymanIcon from "@mui/icons-material/Handyman";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import BatteryCharging20Icon from "@mui/icons-material/BatteryCharging20";
// import SettingsSuggestIcon from "@mui/icons-material/SettingsSuggest";

interface TypeCounts {
  totalVehicles: number;
  activeVehicles: number;
  idleVehicles: number;
  offlineVehicles: number;
}

const Dashboard = () => {
  const navigate = useNavigate();

  const dataProvider = useDataProvider();

  const {
    data: stats = {
      totalVehicles: 0,
      activeVehicles: 0,
      idleVehicles: 0,
      offlineVehicles: 0,
    },
  } = useQuery<TypeCounts>({
    queryKey: ["dashStats"],
    queryFn: () => (dataProvider as any).getOperatorStats(),
  });

  return (
    <Card>
      <CardContent>
        <Box display="flex" flexDirection="column" gap={5} pt={1} pb={4}>
          <Typography variant="h4" mt={2}>
            Welcome to Dashboard
          </Typography>
          <Box>
            <Box>
              <Typography variant="h6">🟦 Fleet Overview</Typography>
            </Box>
            <Grid container spacing={2} mt={1}>
              <DashCard
                v1={stats.totalVehicles}
                v2="Total Vehicles"
                icon={<TimeToLeaveIcon fontSize="large" />}
                onClick={() => navigate("/total-vehicles")}
              ></DashCard>

              <DashCard
                v1={stats.activeVehicles}
                v2="Active Vehicles"
                icon={<PlayCircleIcon fontSize="large" />}
                onClick={() => navigate("/active-vehicles")}
              ></DashCard>

              <DashCard
                v1={stats.idleVehicles}
                v2="Idle Vehicles"
                icon={<AccessTimeFilledIcon fontSize="large" />}
                onClick={() => navigate("/idle-vehicles")}
              ></DashCard>

              <DashCard
                v1={stats.offlineVehicles}
                v2="Offline Vehicles"
                icon={<WifiOffIcon fontSize="large" />}
                onClick={() => navigate("/offline-vehicles")}
              ></DashCard>
            </Grid>
          </Box>

          <Box>
            <Box>
              <Typography variant="h6">🔴 Safety Alerts</Typography>
            </Box>
            <Grid container spacing={2} mt={1}>
              <DashCard
                v1={23}
                v2="Over-Speeding Vehicles"
                icon={<SpeedIcon fontSize="large" />}
                onClick={() => navigate("/over-speeding-vehicles")}
              ></DashCard>

              <DashCard
                v1={251}
                v2="Geo-Fence Violations"
                icon={<WrongLocationIcon fontSize="large" />}
                onClick={() => navigate("/geo-fence-violating-vehicles")}
              ></DashCard>

              <DashCard
                v1={251}
                v2="Crash Detections"
                icon={<CarCrashIcon fontSize="large" />}
                onClick={() => navigate("/crash-detected-vehicles")}
              ></DashCard>
            </Grid>
          </Box>

          <Box>
            <Box>
              <Typography variant="h6">
                🟨 Vehicle Behavior & Performance
              </Typography>
            </Box>
            <Grid container spacing={2} mt={1}>
              {/* <DashCard
                v1={stats.excessiveIdleVehicles}
                v2="Excessive Idling Alerts "
                icon={<HourglassTopIcon fontSize="large" />}
                onClick={() => navigate("/excessive-idle-vehicles")}
              ></DashCard> */}

              <DashCard
                v1={251}
                v2="Low Fuel Vehicles"
                icon={<LocalGasStationIcon fontSize="large" />}
                onClick={() => navigate("/low-fuel-vehicles")}
              ></DashCard>
            </Grid>
          </Box>

          <Box>
            <Box>
              <Typography variant="h6">
                🟥 System Health & Maintenance
              </Typography>
            </Box>
            <Grid container spacing={2} mt={1}>
              {/* <DashCard
                v1={251}
                v2="Engine Breakdown Alerts"
                icon={<HandymanIcon fontSize="large" />}
                onClick={() => navigate("/engine-breakdown-vehicles")}
              ></DashCard> */}

              <DashCard
                v1={251}
                v2="Unplug & Towing Alerts"
                icon={<LocalShippingIcon fontSize="large" />}
                onClick={() => navigate("/unplug-and-towing-vehicles")}
              ></DashCard>

              <DashCard
                v1={251}
                v2="Low Battery Alerts"
                icon={<BatteryCharging20Icon fontSize="large" />}
                onClick={() => navigate("/low-battery-vehicles")}
              ></DashCard>

              {/* <DashCard
                v1={251}
                v2="Upcoming Maintenance"
                icon={<SettingsSuggestIcon fontSize="large" />}
                onClick={() => navigate("/upcomming-maintenance-vehicles")}
              ></DashCard> */}
            </Grid>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default Dashboard;
