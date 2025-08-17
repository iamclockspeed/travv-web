import { Menu } from "react-admin";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";

const CustomMenu = () => (
  <Menu>
    <Menu.DashboardItem />
    <Menu.ResourceItems />
    <Menu.Item
      to="/operators"
      primaryText="Operators"
      leftIcon={<ManageAccountsIcon />}
    />
    <Menu.Item
      to="/vehicles"
      primaryText="Vehicles"
      leftIcon={<DirectionsBusIcon />}
    />
  </Menu>
);

export default CustomMenu;
