import { Card, CardContent, Typography, Grid } from "@mui/material";

const Settings = () => {
  return (
    <div style={{ padding: 5 }}>
      <Grid container spacing={2}>
        <Grid>
          <Card>
            <CardContent>
              <Typography variant="h5">Settings</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};

export default Settings;
