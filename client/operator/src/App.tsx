import { Admin, CustomRoutes } from "react-admin";
import { Route } from "react-router-dom";
import authProvider from "./providers/authProvider";
import dataProvider from "./providers/dataProvider";
import CustomLoginPage from "./screens/login";
import Dashboard from "./screens/dashboard";
import LiveTracking from "./screens/live-tracking";
import Reports from "./screens/reports";
import Settings from "./screens/settings";
import CustomLayout from "./components/layout";
import "leaflet/dist/leaflet.css";

const App = () => (
  <Admin
    authProvider={authProvider}
    dataProvider={dataProvider}
    loginPage={CustomLoginPage}
    dashboard={Dashboard}
    layout={CustomLayout}
  >
    <CustomRoutes>
      <Route path="/live-tracking" element={<LiveTracking />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/settings" element={<Settings />} />
    </CustomRoutes>
  </Admin>
);

export default App;
