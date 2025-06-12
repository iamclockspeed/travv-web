import { Box, Typography, Grid } from "@mui/material";
import { DashCard } from "../components/custom-uis";
import TimeToLeaveIcon from "@mui/icons-material/TimeToLeave";
import AccessTimeFilledIcon from "@mui/icons-material/AccessTimeFilled";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import WifiOffIcon from "@mui/icons-material/WifiOff";

const Dashboard = () => {
  return (
    <Box display="flex" flexDirection="column" gap={5} pt={1}>
      <Typography variant="h4" mt={2}>
        Welcome to Dashboard
      </Typography>
      <Box>
        <Box>
          <Typography variant="h6">🚦Fleet Overview</Typography>
        </Box>
        <Grid container spacing={2} mt={1}>
          <DashCard
            v1={251}
            v2="Total Vahicles"
            icon={<TimeToLeaveIcon fontSize="large" />}
          ></DashCard>

          <DashCard
            v1={251}
            v2="Active Vahicles"
            icon={<PlayCircleIcon fontSize="large" />}
          ></DashCard>

          <DashCard
            v1={251}
            v2="Idle Vahicles"
            icon={<AccessTimeFilledIcon fontSize="large" />}
          ></DashCard>

          <DashCard
            v1={251}
            v2="Offline Vahicles"
            icon={<WifiOffIcon fontSize="large" />}
          ></DashCard>
        </Grid>
      </Box>
    </Box>
  );
};

export default Dashboard;
