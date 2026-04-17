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
const VRouteListActions = () => (
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
export const VRouteList = () => (
  <List resource="routes" actions={<VRouteListActions />}>
    <Datagrid rowClick="show" bulkActionButtons={<PostBulkActionButtons />}>
      <TextField source="id" />
      <TextField source="routeName" />
      <EditButton />
      <DeleteButton mutationMode="pessimistic" />
    </Datagrid>
  </List>
);

// ---------- CREATE ----------
export const VRouteCreate = () => (
  <Create resource="routes">
    <SimpleForm>
      <TextInput source="routeName" required />
      <TextInput source="pathData" required multiline rows={5} />
    </SimpleForm>
  </Create>
);

// ---------- EDIT ----------
export const VRouteEdit = () => (
  <Edit resource="routes" mutationMode="pessimistic">
    <SimpleForm>
      <TextInput source="routeName" required />
      <TextInput source="pathData" required multiline rows={5} />
    </SimpleForm>
  </Edit>
);

// ---------- SHOW ----------
export const VRouteShow = () => (
  <Show resource="routes">
    <SimpleShowLayout>
      <TextField source="id" />
      <TextField source="routeName" />
      <TextField source="pathData" />
    </SimpleShowLayout>
  </Show>
);
