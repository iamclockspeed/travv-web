import { Admin, CustomRoutes } from "react-admin";
import { Route } from "react-router-dom";
import authProvider from "./providers/authProvider";
import dataProvider from "./providers/dataProvider";
import CustomLoginPage from "./screens/login";
import Dashboard from "./screens/dashboard";
import LiveTracking from "./screens/live-tracking";
import TotalVehicles from "./screens/features/total-vehicles";
import LowFuelVehicles from "./screens/features/low-fuel-vehicles";
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
      <Route path="/total-vehicles" element={<TotalVehicles />} />
      <Route path="/low-fuel-vehicles" element={<LowFuelVehicles />} />
    </CustomRoutes>
  </Admin>
);

export default App;
