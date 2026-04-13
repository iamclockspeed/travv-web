import {
  List,
  Datagrid,
  TextField,
  Create,
  SimpleForm,
  TextInput,
  SelectInput,
  EditButton,
  DeleteButton,
  TopToolbar,
  CreateButton,
  BulkDeleteButton,
  type BulkDeleteButtonProps,
  Show,
  SimpleShowLayout,
  Edit,
} from "react-admin";

// ---------- Actions ----------
const DeviceListActions = () => (
  <TopToolbar>
    <CreateButton />
  </TopToolbar>
);

const PostBulkActionButtons = (props: BulkDeleteButtonProps) => (
  <>
    <BulkDeleteButton {...props} color="error" mutationMode="pessimistic" />
  </>
);

// ---------- LIST ----------
export const DeviceList = () => (
  <List resource="devices" actions={<DeviceListActions />}>
    <Datagrid rowClick="show" bulkActionButtons={<PostBulkActionButtons />}>
      <TextField source="deviceId" />
      <TextField source="imei" label="IMEI" />
      <TextField source="simNumber" />
      <TextField source="model" />
      <TextField source="manufacturer" />
      <TextField source="firmwareVersion" />
      <TextField source="type" />
      <EditButton />
      <DeleteButton mutationMode="pessimistic" />
    </Datagrid>
  </List>
);

// ---------- CREATE ----------
export const DeviceCreate = () => (
  <Create resource="devices">
    <SimpleForm>
      <TextInput source="deviceId" label="Device ID / Serial no" required />
      <TextInput source="imei" label="IMEI" required />
      <TextInput source="simNumber" required />
      <TextInput source="model" required />
      <TextInput source="manufacturer" required />
      <TextInput source="firmwareVersion" required />
      <SelectInput
        source="type"
        choices={[{ id: "GPS", name: "GPS" }]}
        defaultValue="GPS"
        required
      />
    </SimpleForm>
  </Create>
);

// ---------- EDIT ----------
export const DeviceEdit = () => (
  <Edit resource="devices" mutationMode="pessimistic">
    <SimpleForm>
      <TextInput
        source="deviceId"
        label="Device ID / Serial no"
        required
        disabled
      />
      <TextInput source="imei" label="IMEI" required disabled />
      <TextInput source="simNumber" required />
      <TextInput source="model" required />
      <TextInput source="manufacturer" required />
      <TextInput source="firmwareVersion" required />
      <SelectInput
        source="type"
        choices={[{ id: "GPS", name: "GPS" }]}
        defaultValue="GPS"
        required
      />
    </SimpleForm>
  </Edit>
);

// ---------- SHOW ----------
export const DeviceShow = () => (
  <Show resource="devices">
    <SimpleShowLayout>
      <TextField source="id" />
      <TextField source="deviceId" label="Device ID / Serial no" />
      <TextField source="imei" label="IMEI" />
      <TextField source="simNumber" />
      <TextField source="model" />
      <TextField source="manufacturer" />
      <TextField source="firmwareVersion" />
      <TextField source="type" />
      <TextField source="vehicle.registrationNumber" defaultValue="NA" />
    </SimpleShowLayout>
  </Show>
);
