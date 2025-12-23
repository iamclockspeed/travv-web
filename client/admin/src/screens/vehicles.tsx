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
  Edit,
  ArrayField,
  BooleanField,
  Show,
  SimpleShowLayout,
  AutocompleteInput,
  type FileFieldProps,
  useRecordContext,
  FormDataConsumer,
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
      <TextField source="type" />
      <TextField source="make" />
      <TextField source="model" />
      <TextField source="fuelType" />
      <TextField
        source="device.deviceId"
        label="Device ID / Serial no"
        defaultValue="NA"
      />
      <TextField source="operator.id" label="Operator ID" defaultValue="NA" />
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

  const { data: operators = [] } = useQuery({
    queryKey: ["availableOperators"],
    queryFn: async () => {
      const response = await dataProvider.getList("operators", {
        pagination: { page: 1, perPage: 100 },
        sort: { field: "fullLegalName", order: "ASC" },
        filter: { status: "active" },
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
        <AutocompleteInput
          source="device"
          choices={devices}
          optionText="deviceId"
          optionValue="id"
          filterToQuery={(searchText) => ({ deviceId: searchText })}
        />
        <AutocompleteInput
          source="operator"
          choices={operators}
          optionText={(choice) => `${choice.id} - ${choice.fullLegalName}`}
          optionValue="id"
          filterToQuery={(searchText) => ({ q: searchText })}
          matchSuggestion={(filter, choice) =>
            choice.id.toString().includes(filter) ||
            choice.fullLegalName.toLowerCase().includes(filter.toLowerCase())
          }
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
              <FileField
                source="src"
                title="title"
                target="_blank"
                rel="noopener noreferrer"
              />
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
                "image/*": [".png", ".jpg", ".jpeg"],
              }}
            >
              <FileField
                source="src"
                title="title"
                target="_blank"
                rel="noopener noreferrer"
              />
            </FileInput>
          </SimpleFormIterator>
        </ArrayInput>
      </SimpleForm>
    </Create>
  );
};

// ---------- EDIT ----------
export const VehicleEdit = () => {
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

  const { data: operators = [] } = useQuery({
    queryKey: ["availableOperators"],
    queryFn: async () => {
      const response = await dataProvider.getList("operators", {
        pagination: { page: 1, perPage: 100 },
        sort: { field: "fullLegalName", order: "ASC" },
        filter: { status: "active" },
      });
      return response.data;
    },
  });

  return (
    <Edit resource="vehicles" mutationMode="pessimistic">
      <SimpleForm>
        <TextInput source="registrationNumber" required disabled />
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
        <AutocompleteInput
          source="device"
          choices={devices}
          optionText="deviceId"
          optionValue="id"
          filterToQuery={(searchText) => ({ deviceId: searchText })}
        />
        <AutocompleteInput
          source="operator"
          choices={operators}
          optionText={(choice) => `${choice.id} - ${choice.fullLegalName}`}
          optionValue="id"
          filterToQuery={(searchText) => ({ q: searchText })}
          matchSuggestion={(filter, choice) =>
            choice.id.toString().includes(filter) ||
            choice.fullLegalName.toLowerCase().includes(filter.toLowerCase())
          }
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
            <FormDataConsumer>
              {({ scopedFormData }) => (
                <FileInput
                  source="url"
                  label="Upload File"
                  accept={{
                    "application/pdf": [".pdf"],
                    "image/*": [".png", ".jpg", ".jpeg"],
                  }}
                  format={(value) => {
                    if (typeof value != "string") {
                      return value;
                    } else {
                      return {
                        src: import.meta.env.VITE_BACKEND_HOST + value,
                        title: scopedFormData?.type,
                      };
                    }
                  }}
                >
                  <FileField
                    source="src"
                    title="title"
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                </FileInput>
              )}
            </FormDataConsumer>
            <BooleanInput source="verified" />
          </SimpleFormIterator>
        </ArrayInput>
        <ArrayInput source="images">
          <SimpleFormIterator>
            <TextInput source="description" />
            <FormDataConsumer>
              {({ scopedFormData }) => (
                <FileInput
                  source="url"
                  label="Upload File"
                  accept={{
                    "image/*": [".png", ".jpg", ".jpeg"],
                  }}
                  format={(value) => {
                    if (typeof value != "string") {
                      return value;
                    } else {
                      return {
                        src: import.meta.env.VITE_BACKEND_HOST + value,
                        title: scopedFormData?.description,
                      };
                    }
                  }}
                >
                  <FileField
                    source="src"
                    title="title"
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                </FileInput>
              )}
            </FormDataConsumer>
          </SimpleFormIterator>
        </ArrayInput>
      </SimpleForm>
    </Edit>
  );
};

// ---------- SHOW ----------
export const VehicleShow = () => (
  <Show resource="vehicles">
    <SimpleShowLayout>
      <TextField source="id" />
      <TextField source="registrationNumber" />
      <TextField source="type" />
      <TextField source="make" />
      <TextField source="model" />
      <TextField source="fuelType" />
      <TextField
        source="device.deviceId"
        label="Device ID / Serial no"
        defaultValue="NA"
      />
      <TextField source="operator.id" label="Operator ID" defaultValue="NA" />
      <ArrayField source="documents">
        <Datagrid bulkActionButtons={false} rowClick={false}>
          <FileWithHost
            source="url"
            title="type"
            label="Uploaded File"
            target="_blank"
            rel="noopener noreferrer"
          />
          <BooleanField source="verified" label="Verified" />
        </Datagrid>
      </ArrayField>
      <ArrayField source="images">
        <Datagrid bulkActionButtons={false} rowClick={false}>
          <FileWithHost
            source="url"
            title="description"
            label="Uploaded File"
            target="_blank"
            rel="noopener noreferrer"
          />
        </Datagrid>
      </ArrayField>
    </SimpleShowLayout>
  </Show>
);

type FileRecord = {
  id: number;
  url: string;
};

const FileWithHost = (props: FileFieldProps<FileRecord>) => {
  const record = useRecordContext<FileRecord>();
  if (!record?.url) return null;

  return (
    <FileField
      {...props}
      record={{
        ...record,
        url: `${import.meta.env.VITE_BACKEND_HOST}${record.url}`,
      }}
    />
  );
};
