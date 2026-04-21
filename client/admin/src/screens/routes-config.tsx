import {
  List,
  Datagrid,
  TextField,
  Create,
  SimpleForm,
  TextInput,
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

import { JsonField } from "react-admin-json-view";

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
      <JsonField
        source="pathData"
        reactJsonOptions={{ collapsed: true, collapseStringsAfterLength: 50 }}
      />
    </SimpleShowLayout>
  </Show>
);
