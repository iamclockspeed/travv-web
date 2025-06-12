import { Card, CardContent, Typography, Grid } from "@mui/material";

const Dashboard = () => {
  return (
    <div style={{ padding: 5 }}>
      <Grid container spacing={2}>
        <Grid>
          <Card>
            <CardContent>
              <Typography variant="h5">Users</Typography>
              <Typography variant="body2">Manage your users here.</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid>
          <Card>
            <CardContent>
              <Typography variant="h5">Posts</Typography>
              <Typography variant="body2">View and edit posts.</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid>
          <Card>
            <CardContent>
              <Typography variant="h5">Reports</Typography>
              <Typography variant="body2">Check system reports.</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};

export default Dashboard;
