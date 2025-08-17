import { Card, CardContent, Box, Typography, Grid } from "@mui/material";
import { DashCard } from "../components/custom-uis";
import TimeToLeaveIcon from "@mui/icons-material/TimeToLeave";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import PersonIcon from "@mui/icons-material/Person";
import RecordVoiceOverIcon from "@mui/icons-material/RecordVoiceOver";
import PersonOffIcon from "@mui/icons-material/PersonOff";

const Dashboard = () => {
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
                v1={251}
                v2="Total Operators"
                icon={<PersonIcon fontSize="large" />}
              ></DashCard>

              <DashCard
                v1={251}
                v2="Active Operators"
                icon={<RecordVoiceOverIcon fontSize="large" />}
              ></DashCard>

              <DashCard
                v1={251}
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
                v1={251}
                v2="Total Vehicles"
                icon={<TimeToLeaveIcon fontSize="large" />}
              ></DashCard>

              <DashCard
                v1={251}
                v2="Active Vahicles"
                icon={<PlayCircleIcon fontSize="large" />}
              ></DashCard>

              <DashCard
                v1={251}
                v2="Offline Vahicles"
                icon={<WifiOffIcon fontSize="large" />}
              ></DashCard>
            </Grid>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default Dashboard;
