import { useNavigate } from "react-router-dom";
import { useDataProvider } from "react-admin";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, Box, Typography, Grid } from "@mui/material";
import { DashCard } from "../components/custom-uis";
import TimeToLeaveIcon from "@mui/icons-material/TimeToLeave";
import AccessTimeFilledIcon from "@mui/icons-material/AccessTimeFilled";
import NearMeIcon from "@mui/icons-material/NearMe";
import PinDropIcon from "@mui/icons-material/PinDrop";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import SpeedIcon from "@mui/icons-material/Speed";
import WrongLocationIcon from "@mui/icons-material/WrongLocation";
import CarCrashIcon from "@mui/icons-material/CarCrash";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import PowerOffIcon from "@mui/icons-material/PowerOff";
import CarRepairIcon from "@mui/icons-material/CarRepair";
import BatteryCharging20Icon from "@mui/icons-material/BatteryCharging20";

interface TypeCounts {
  totalVehicles: number;
  activeVehicles: number;
  idleVehicles: number;
  parkedVehicles: number;
  offlineVehicles: number;
  overspeeding: number;
  violategeofence: number;
  crashDetected: number;
  excessiveIdleVehicles: number;
  lowFuelVehicles: number;
  lowBatteryVehicles: number;
  unpluggedVehicles: number;
  towingVehicles: number;
}

const Dashboard = () => {
  const navigate = useNavigate();

  const dataProvider = useDataProvider();

  const {
    data: stats = {
      totalVehicles: 0,
      activeVehicles: 0,
      idleVehicles: 0,
      parkedVehicles: 0,
      offlineVehicles: 0,
      overspeeding: 0,
      violategeofence: 0,
      crashDetected: 0,
      excessiveIdleVehicles: 0,
      lowFuelVehicles: 0,
      lowBatteryVehicles: 0,
      unpluggedVehicles: 0,
      towingVehicles: 0,
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
                icon={<NearMeIcon fontSize="large" />}
                onClick={() => navigate("/active-vehicles")}
              ></DashCard>

              <DashCard
                v1={stats.idleVehicles}
                v2="Idle Vehicles"
                icon={<AccessTimeFilledIcon fontSize="large" />}
                onClick={() => navigate("/idle-vehicles")}
              ></DashCard>

              <DashCard
                v1={stats.parkedVehicles}
                v2="Parked Vehicles"
                icon={<PinDropIcon fontSize="large" />}
                onClick={() => navigate("/parked-vehicles")}
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
                v1={stats.overspeeding}
                v2="Over-Speeding Vehicles"
                icon={<SpeedIcon fontSize="large" />}
                onClick={() => navigate("/over-speeding-vehicles")}
              ></DashCard>

              <DashCard
                v1={stats.violategeofence}
                v2="Geo-Fence Violations"
                icon={<WrongLocationIcon fontSize="large" />}
                onClick={() => navigate("/geo-fence-violating-vehicles")}
              ></DashCard>

              <DashCard
                v1={stats.crashDetected}
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
              <DashCard
                v1={stats.excessiveIdleVehicles}
                v2="Excessive Idling Alerts "
                icon={<HourglassTopIcon fontSize="large" />}
                onClick={() => navigate("/excessive-idle-vehicles")}
              ></DashCard>

              <DashCard
                v1={stats.lowFuelVehicles}
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
              <DashCard
                v1={stats.lowBatteryVehicles}
                v2="Low Battery Alerts"
                icon={<BatteryCharging20Icon fontSize="large" />}
                onClick={() => navigate("/low-battery-vehicles")}
              ></DashCard>

              <DashCard
                v1={stats.unpluggedVehicles}
                v2="Unplug Alerts"
                icon={<PowerOffIcon fontSize="large" />}
                onClick={() => navigate("/unplugged-vehicles")}
              ></DashCard>

              <DashCard
                v1={stats.towingVehicles}
                v2="Towing Alerts"
                icon={<CarRepairIcon fontSize="large" />}
                onClick={() => navigate("/towing-vehicles")}
              ></DashCard>
            </Grid>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default Dashboard;
