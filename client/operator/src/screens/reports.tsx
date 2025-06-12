import { Card, CardContent, Typography, Grid } from "@mui/material";

const Reports = () => {
  return (
    <div style={{ padding: 5 }}>
      <Grid container spacing={2}>
        <Grid>
          <Card>
            <CardContent>
              <Typography variant="h5">Reports</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};

export default Reports;
