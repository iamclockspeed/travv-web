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
// import VehicleList from "./screens/vehicles";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
// import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";

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
    {/* <Resource icon={DirectionsBusIcon} name="vehicles" list={VehicleList} /> */}
  </Admin>
);

export default App;
