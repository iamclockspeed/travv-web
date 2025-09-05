import {
  List,
  Datagrid,
  TextField,
  EmailField,
  EditButton,
  DeleteButton,
  TopToolbar,
  CreateButton,
  Edit,
  SimpleForm,
  TextInput,
  SelectInput,
  DateInput,
  Create,
  Show,
  SimpleShowLayout,
  DateField,
  ArrayInput,
  SimpleFormIterator,
  FileInput,
  FileField,
  BooleanInput,
} from "react-admin";

// ---------- Actions ----------
const OperatorListActions = () => (
  <TopToolbar>
    <CreateButton />
  </TopToolbar>
);

// ---------- LIST ----------
export const OperatorList = () => (
  <List resource="operators" actions={<OperatorListActions />}>
    <Datagrid rowClick="show">
      <TextField source="id" />
      <TextField source="profileName" label="Profile Name" />
      <TextField source="fullLegalName" label="Legal Name" />
      <EmailField source="email" />
      <TextField source="phone" />
      <TextField source="status" />
      <TextField source="vehicleOwnershipType" />
      <EditButton />
      <DeleteButton />
    </Datagrid>
  </List>
);

// ---------- CREATE ----------
export const OperatorCreate = () => (
  <Create resource="operators">
    <SimpleForm>
      <TextInput source="fullLegalName" label="Full Legal Name" required />
      <TextInput source="profileName" label="Profile Name" required />
      <TextInput source="email" type="email" required />
      <TextInput source="phone" required />
      <TextInput source="password" type="password" required />

      <SelectInput
        source="status"
        choices={[
          { id: "active", name: "Active" },
          { id: "debarred", name: "Pending" },
        ]}
        defaultValue="active"
        required
      />

      <TextInput source="companyName" />
      <TextInput source="companyAddress" />
      <ArrayInput source="companyDocuments">
        <SimpleFormIterator>
          <TextInput source="type" label="Document Type" />
          <FileInput
            source="url"
            label="Upload File"
            accept={{
              "application/pdf": [".pdf"],
              "image/*": [".png", ".jpg", ".jpeg"],
            }}
          >
            <FileField source="src" title="title" />
          </FileInput>
          <BooleanInput source="verified" />
        </SimpleFormIterator>
      </ArrayInput>
    </SimpleForm>
  </Create>
);

// ---------- EDIT ----------
export const OperatorEdit = () => (
  <Edit resource="operators">
    <SimpleForm>
      <TextInput source="fullLegalName" label="Full Legal Name" required />
      <TextInput source="profileName" label="Profile Name" required />
      <TextInput source="email" type="email" required />
      <TextInput source="phone" required />

      <SelectInput
        source="status"
        choices={[
          { id: "active", name: "Active" },
          { id: "inactive", name: "Inactive" },
          { id: "suspended", name: "Suspended" },
          { id: "pending", name: "Pending" },
        ]}
      />

      <SelectInput
        source="vehicleOwnershipType"
        choices={[
          { id: "owner", name: "Owner" },
          { id: "driver", name: "Driver" },
          { id: "fleet_manager", name: "Fleet Manager" },
        ]}
      />

      <TextInput source="licenseNumber" />
      <DateInput source="licenseExpiryDate" />
      <TextInput source="companyName" />
      <TextInput source="address" />
    </SimpleForm>
  </Edit>
);

// ---------- SHOW ----------
export const OperatorShow = () => (
  <Show resource="operators">
    <SimpleShowLayout>
      <TextField source="id" />
      <TextField source="profileName" label="Profile Name" />
      <TextField source="fullLegalName" label="Full Legal Name" />
      <EmailField source="email" />
      <TextField source="phone" />
      <TextField source="status" />
      <TextField source="vehicleOwnershipType" />
      <TextField source="licenseNumber" />
      <DateField source="licenseExpiryDate" />
      <TextField source="companyName" />
      <TextField source="address" />
    </SimpleShowLayout>
  </Show>
);
