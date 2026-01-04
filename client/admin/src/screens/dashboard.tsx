import { useDataProvider } from "react-admin";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, Box, Typography, Grid } from "@mui/material";
import { DashCard } from "../components/custom-uis";
import TimeToLeaveIcon from "@mui/icons-material/TimeToLeave";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import PersonIcon from "@mui/icons-material/Person";
import RecordVoiceOverIcon from "@mui/icons-material/RecordVoiceOver";
import PersonOffIcon from "@mui/icons-material/PersonOff";
import DevicesIcon from "@mui/icons-material/Devices";
import UsbIcon from "@mui/icons-material/Usb";
import UsbOffIcon from "@mui/icons-material/UsbOff";

interface TypeCounts {
  total: number;
  active: number;
  debarred: number;
  used: number;
  unused: number;
  offline: number;
}

const Dashboard = () => {
  const dataProvider = useDataProvider();

  const { data: opCounts = { total: 0, active: 0, debarred: 0 } } =
    useQuery<TypeCounts>({
      queryKey: ["operatorCounts"],
      queryFn: () => (dataProvider as any).getOperatorCounts(),
    });

  const { data: veCounts = { total: 0, active: 0, offline: 0 } } =
    useQuery<TypeCounts>({
      queryKey: ["vehicleCounts"],
      queryFn: () => (dataProvider as any).getVehicleCounts(),
    });

  const { data: dvCounts = { total: 0, used: 0, unused: 0 } } =
    useQuery<TypeCounts>({
      queryKey: ["deviceCounts"],
      queryFn: () => (dataProvider as any).getDeviceCounts(),
    });

  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Box display="flex" flexDirection="column" gap={5} pt={1} pb={4}>
          <Typography variant="h4" mt={2}>
            Welcome to Dashboard
          </Typography>
          <Box>
            <Box>
              <Typography variant="h6">🟦 Operators</Typography>
            </Box>
            <Grid container spacing={2} mt={1}>
              <DashCard
                v1={opCounts.total}
                v2="Total Operators"
                icon={<PersonIcon fontSize="large" />}
              ></DashCard>

              <DashCard
                v1={opCounts.active}
                v2="Active Operators"
                icon={<RecordVoiceOverIcon fontSize="large" />}
              ></DashCard>

              <DashCard
                v1={opCounts.debarred}
                v2="Debarred Operators"
                icon={<PersonOffIcon fontSize="large" />}
              ></DashCard>
            </Grid>
          </Box>

          <Box>
            <Box>
              <Typography variant="h6">🟨 Vehicles</Typography>
            </Box>
            <Grid container spacing={2} mt={1}>
              <DashCard
                v1={veCounts.total}
                v2="Total Vehicles"
                icon={<TimeToLeaveIcon fontSize="large" />}
              ></DashCard>

              <DashCard
                v1={veCounts.active}
                v2="Active Vehicles"
                icon={<PlayCircleIcon fontSize="large" />}
              ></DashCard>

              <DashCard
                v1={veCounts.offline}
                v2="Offline Vehicles"
                icon={<WifiOffIcon fontSize="large" />}
              ></DashCard>
            </Grid>
          </Box>

          <Box>
            <Box>
              <Typography variant="h6">🟥 Devices</Typography>
            </Box>
            <Grid container spacing={2} mt={1}>
              <DashCard
                v1={dvCounts.total}
                v2="Total Devices"
                icon={<DevicesIcon fontSize="large" />}
              ></DashCard>

              <DashCard
                v1={dvCounts.used}
                v2="Connected Devices"
                icon={<UsbIcon fontSize="large" />}
              ></DashCard>

              <DashCard
                v1={dvCounts.unused}
                v2="Un-used Devices"
                icon={<UsbOffIcon fontSize="large" />}
              ></DashCard>
            </Grid>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default Dashboard;
