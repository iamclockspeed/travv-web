// Import Requisites
import { Admin, Resource } from "react-admin";

// Import Custom
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
import {
  VRouteList,
  VRouteCreate,
  VRouteShow,
  VRouteEdit,
} from "./screens/routes-config";
import { FeedbackList } from "./screens/feedback";
import { SupportList } from "./screens/support";

// Import Icons
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import DevicesIcon from "@mui/icons-material/Devices";
import RouteIcon from "@mui/icons-material/Route";
import FeedbackIcon from "@mui/icons-material/Feedback";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";

// Implementation
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

    <Resource
      icon={RouteIcon}
      name="routes"
      list={VRouteList}
      create={VRouteCreate}
      edit={VRouteEdit}
      show={VRouteShow}
    />

    <Resource
      icon={FeedbackIcon}
      name="feedbacks"
      list={FeedbackList}
      options={{ label: "Feedbacks" }}
    />

    <Resource
      icon={SupportAgentIcon}
      name="supports"
      list={SupportList}
      options={{ label: "Supports" }}
    />
  </Admin>
);

export default App;
