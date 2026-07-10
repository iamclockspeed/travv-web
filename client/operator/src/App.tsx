import { Admin, CustomRoutes } from "react-admin";
import { Route } from "react-router-dom";
import authProvider from "./providers/authProvider";
import dataProvider from "./providers/dataProvider";
import CustomLoginPage from "./screens/login";
import Dashboard from "./screens/dashboard";
import ManageAccount from "./screens/account/manage-account";
import Support from "./screens/account/support";
import Feedback from "./screens/account/feedback";
import LiveTracking from "./screens/live-tracking";
import {
  TotalVehicles,
  ActiveVehicles,
  IdleVehicles,
  OfflineVehicles,
  OverSpeedingVehicles,
  GeoFenceViolatingVehicles,
  CrashDetectedVehicles,
  ExcessiveIdleVehicles,
  LowFuelVehicles,
  EngineBreakdownVehicles,
  UnTVehicles,
  LowBatteryVehicles,
  UMVehicles,
} from "./screens/vehicle-list";
import CustomLayout from "./components/layout";
import "leaflet/dist/leaflet.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const App = () => (
  <Admin
    authProvider={authProvider}
    dataProvider={dataProvider}
    loginPage={CustomLoginPage}
    dashboard={Dashboard}
    layout={CustomLayout}
  >
    <CustomRoutes>
      <Route path="/manage-account" element={<ManageAccount />} />
      <Route path="/support" element={<Support />} />
      <Route path="/feedback" element={<Feedback />} />

      <Route path="/live-tracking" element={<LiveTracking />} />

      <Route path="/total-vehicles" element={<TotalVehicles />} />
      <Route path="/active-vehicles" element={<ActiveVehicles />} />
      <Route path="/idle-vehicles" element={<IdleVehicles />} />
      <Route path="/offline-vehicles" element={<OfflineVehicles />} />

      <Route
        path="/over-speeding-vehicles"
        element={<OverSpeedingVehicles />}
      />
      <Route
        path="/geo-fence-violating-vehicles"
        element={<GeoFenceViolatingVehicles />}
      />
      <Route
        path="/crash-detected-vehicles"
        element={<CrashDetectedVehicles />}
      />

      <Route
        path="/excessive-idle-vehicles"
        element={<ExcessiveIdleVehicles />}
      />
      <Route path="/low-fuel-vehicles" element={<LowFuelVehicles />} />

      <Route
        path="/engine-breakdown-vehicles"
        element={<EngineBreakdownVehicles />}
      />
      <Route path="/unplug-and-towing-vehicles" element={<UnTVehicles />} />
      <Route path="/low-battery-vehicles" element={<LowBatteryVehicles />} />
      <Route path="/upcomming-maintenance-vehicles" element={<UMVehicles />} />
    </CustomRoutes>
  </Admin>
);

export default App;
