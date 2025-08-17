import {
  List,
  Datagrid,
  TextField,
  EmailField,
  EditButton,
  DeleteButton,
  TopToolbar,
  CreateButton,
} from "react-admin";

const OperatorListActions = () => (
  <TopToolbar>
    <CreateButton />
  </TopToolbar>
);

const OperatorList = () => (
  <List resource="operators" actions={<OperatorListActions />}>
    <Datagrid>
      <TextField source="id" />
      <TextField source="name" />
      <EmailField source="email" />
      <TextField source="status" />
      <EditButton />
      <DeleteButton />
    </Datagrid>
  </List>
);

export default OperatorList;
