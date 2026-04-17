import {
  Admin,
  Resource,
  List,
  Datagrid,
  TextField,
  DateField,
  type ListProps,
  type RaRecord,
  useRecordContext,
} from "react-admin";
import { useState } from "react";
import { Button, Dialog, DialogContent, DialogTitle } from "@mui/material";
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
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import DevicesIcon from "@mui/icons-material/Devices";
import RouteIcon from "@mui/icons-material/Route";
import FeedbackIcon from "@mui/icons-material/Feedback";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";

const FullMessageDialog = ({ text }: { text: string }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="small" onClick={() => setOpen(true)}>
        View
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Message</DialogTitle>
        <DialogContent>
          <p style={{ whiteSpace: "pre-wrap" }}>{text}</p>
        </DialogContent>
      </Dialog>
    </>
  );
};

export const TruncatedMessageField = ({ source }: { source: string }) => {
  const record = useRecordContext<RaRecord>();
  if (!record) return null;

  const value = record[source] as string;
  if (!value) return null;

  const short = value.length > 50 ? value.substring(0, 50) + "..." : value;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span>{short}</span>
      {value.length > 50 && <FullMessageDialog text={value} />}
    </div>
  );
};

export const FeedbackList: React.FC<ListProps> = (props) => (
  <List {...props} title="User Feedbacks">
    <Datagrid rowClick={false} bulkActionButtons={false}>
      <TextField source="id" />
      <TextField source="user.name" label="Name" />
      <TextField source="user.email" label="Email" />
      <TextField source="user.phone" label="Phone" />
      <TextField source="rating" label="Rating" />
      <TruncatedMessageField source="message" />
      <DateField source="createdAt" label="Submitted" />
    </Datagrid>
  </List>
);

export const SupportList: React.FC<ListProps> = (props) => (
  <List {...props} title="User Supports">
    <Datagrid rowClick={false} bulkActionButtons={false}>
      <TextField source="id" />
      <TextField source="user.name" label="Name" />
      <TextField source="user.email" label="Email" />
      <TextField source="user.phone" label="Phone" />
      <TextField source="category" />
      <TruncatedMessageField source="message" />
      <DateField source="createdAt" label="Submitted" />
    </Datagrid>
  </List>
);

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
