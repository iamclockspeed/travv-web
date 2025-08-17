import { Admin, CustomRoutes } from "react-admin";
import { Route } from "react-router-dom";
import authProvider from "./providers/authProvider";
import dataProvider from "./providers/dataProvider";
import Dashboard from "./screens/dashboard";
import CustomLoginPage from "./screens/login";
import CustomLayout from "./components/layout";
import OperatorList from "./screens/operators";
import VehicleList from "./screens/vehicles";

const App = () => (
  <Admin
    authProvider={authProvider}
    dataProvider={dataProvider}
    loginPage={CustomLoginPage}
    dashboard={Dashboard}
    layout={CustomLayout}
  >
    <CustomRoutes>
      <Route path="/operators" element={<OperatorList />} />
      <Route path="/vehicles" element={<VehicleList />} />
    </CustomRoutes>
  </Admin>
);

export default App;
