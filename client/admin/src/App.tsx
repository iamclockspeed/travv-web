import { Admin, Resource } from "react-admin";
import authProvider from "./providers/authProvider";
import dataProvider from "./providers/dataProvider";
import Dashboard from "./screens/dashboard";
import CustomLoginPage from "./screens/login";
import CustomLayout from "./components/layout";
import {
  OperatorList,
  OperatorEdit,
  OperatorShow,
  OperatorCreate,
} from "./screens/operators";
import {
  VehicleList,
  VehicleCreate,
  VehicleShow,
  VehicleEdit,
} from "./screens/vehicles";
import {
  DeviceList,
  DeviceCreate,
  DeviceShow,
  DeviceEdit,
} from "./screens/devices";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import DevicesIcon from "@mui/icons-material/Devices";

const App = () => (
  <Admin
    authProvider={authProvider}
    dataProvider={dataProvider}
    loginPage={CustomLoginPage}
    dashboard={Dashboard}
    layout={CustomLayout}
  >
    <Resource
      icon={ManageAccountsIcon}
      name="operators"
      list={OperatorList}
      create={OperatorCreate}
      edit={OperatorEdit}
      show={OperatorShow}
    />
    <Resource
      icon={DirectionsBusIcon}
      name="vehicles"
      list={VehicleList}
      create={VehicleCreate}
      edit={VehicleEdit}
      show={VehicleShow}
    />
    <Resource
      icon={DevicesIcon}
      name="devices"
      list={DeviceList}
      create={DeviceCreate}
      edit={DeviceEdit}
      show={DeviceShow}
    />
  </Admin>
);

export default App;
