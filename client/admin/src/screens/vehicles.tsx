import {
  List,
  Datagrid,
  TextField,
  ReferenceField,
  EditButton,
  DeleteButton,
  TopToolbar,
  CreateButton,
} from "react-admin";

const VehicleListActions = () => (
  <TopToolbar>
    <CreateButton />
  </TopToolbar>
);

const VehicleList = () => (
  <List resource="vehicles" actions={<VehicleListActions />}>
    <Datagrid>
      <TextField source="id" />
      <TextField source="plateNumber" />
      <TextField source="status" />
      <ReferenceField source="operatorId" reference="operators">
        <TextField source="name" />
      </ReferenceField>
      <EditButton />
      <DeleteButton />
    </Datagrid>
  </List>
);

export default VehicleList;
