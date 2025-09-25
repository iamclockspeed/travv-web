import {
  List,
  Datagrid,
  TextField,
  Create,
  SimpleForm,
  TextInput,
  SelectInput,
  ArrayInput,
  EditButton,
  DeleteButton,
  TopToolbar,
  CreateButton,
  BulkDeleteButton,
  type BulkDeleteButtonProps,
  BooleanInput,
  FileField,
  FileInput,
  SimpleFormIterator,
  DateInput,
  useDataProvider,
} from "react-admin";
import { useQuery } from "@tanstack/react-query";

// ---------- Actions ----------
const VehicleListActions = () => (
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
export const VehicleList = () => (
  <List resource="vehicles" actions={<VehicleListActions />}>
    <Datagrid rowClick="show" bulkActionButtons={<PostBulkActionButtons />}>
      <TextField source="registrationNumber" />
      <EditButton />
      <DeleteButton mutationMode="pessimistic" />
    </Datagrid>
  </List>
);

// ---------- CREATE ----------
export const VehicleCreate = () => {
  const dataProvider = useDataProvider();

  const { data: devices = [] } = useQuery({
    queryKey: ["availableDevices"],
    queryFn: async () => {
      const response = await dataProvider.getList("devices", {
        pagination: { page: 1, perPage: 100 },
        sort: { field: "deviceId", order: "ASC" },
        filter: { alreadyInUse: false },
      });
      return response.data;
    },
  });

  return (
    <Create resource="vehicles">
      <SimpleForm>
        <TextInput source="registrationNumber" required />
        <SelectInput
          source="type"
          choices={[
            { id: "Bus", name: "Bus" },
            { id: "Car", name: "Car" },
            { id: "Van", name: "Van" },
            { id: "CNEQP", name: "CNEQP" },
            { id: "Motorcycle", name: "Motorcycle" },
            { id: "Bicycle", name: "Bicycle" },
          ]}
          defaultValue="Bus"
          required
        />
        <TextInput source="make" required />
        <TextInput source="model" required />
        <SelectInput
          source="fuelType"
          choices={[
            { id: "Diesel", name: "Diesel" },
            { id: "Petrol", name: "Petrol" },
            { id: "CNG", name: "CNG" },
            { id: "Electric", name: "Electric" },
            { id: "Hybrid", name: "Hybrid" },
          ]}
          defaultValue="Diesel"
          required
        />
        <SelectInput
          source="device"
          choices={devices}
          optionText="name"
          optionValue="id"
        />
        <ArrayInput source="documents">
          <SimpleFormIterator>
            <SelectInput
              source="type"
              choices={[
                { id: "RC", name: "RC" },
                { id: "FitnessCertificate", name: "FitnessCertificate" },
                { id: "PUCC", name: "PUCC" },
                { id: "Insurance", name: "Insurance" },
                { id: "Invoice", name: "Invoice" },
              ]}
              defaultValue="RC"
              required
            />
            <TextInput source="number" />
            <DateInput source="expiryDate" />
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
        <ArrayInput source="images">
          <SimpleFormIterator>
            <TextInput source="description" />
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
          </SimpleFormIterator>
        </ArrayInput>
      </SimpleForm>
    </Create>
  );
};
