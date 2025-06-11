import { Admin, Resource } from "react-admin";
import authProvider from "./providers/authProvider";
import dataProvider from "./providers/dataProvider";
import { Card, CardContent, Typography, Grid } from "@mui/material";
import CustomLoginPage from "./screens/login";

const WelcomePage = () => {
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

const App = () => (
  <Admin
    authProvider={authProvider}
    dataProvider={dataProvider}
    dashboard={WelcomePage}
    loginPage={CustomLoginPage}
  >
    <Resource name="posts" />
  </Admin>
);

export default App;
