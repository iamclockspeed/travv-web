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
  Create,
  Show,
  SimpleShowLayout,
  ArrayField,
  BooleanField,
  ArrayInput,
  SimpleFormIterator,
  FileInput,
  FileField,
  BooleanInput,
  BulkDeleteButton,
  type BulkDeleteButtonProps,
  useRecordContext,
  type FileFieldProps,
  FormDataConsumer,
} from "react-admin";

// ---------- Actions ----------
const OperatorListActions = () => (
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
export const OperatorList = () => (
  <List resource="operators" actions={<OperatorListActions />}>
    <Datagrid rowClick="show" bulkActionButtons={<PostBulkActionButtons />}>
      <TextField source="id" />
      <TextField source="fullLegalName" label="Legal Name" />
      <EmailField source="email" />
      <TextField source="phone" />
      <TextField source="status" />
      <EditButton />
      <DeleteButton mutationMode="pessimistic" />
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
          { id: "debarred", name: "Debarred" },
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
    </SimpleForm>
  </Create>
);

// ---------- EDIT ----------
export const OperatorEdit = () => (
  <Edit resource="operators" mutationMode="pessimistic">
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
          { id: "debarred", name: "Debarred" },
        ]}
        defaultValue="active"
        required
      />

      <TextInput source="companyName" />
      <TextInput source="companyAddress" />
      <ArrayInput source="companyDocuments">
        <SimpleFormIterator>
          <TextInput source="type" label="Document Type" />
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
    </SimpleForm>
  </Edit>
);

// ---------- SHOW ----------
export const OperatorShow = () => (
  <Show resource="operators">
    <SimpleShowLayout>
      <TextField source="id" />
      <TextField source="fullLegalName" />
      <TextField source="profileName" />
      <EmailField source="email" />
      <TextField source="phone" />
      <TextField source="password" />
      <TextField source="status" />
      <TextField source="companyName" defaultValue="NA" />
      <TextField source="companyAddress" defaultValue="NA" />
      <ArrayField source="companyDocuments">
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
