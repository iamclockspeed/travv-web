import { Menu } from "react-admin";
import LocationPinIcon from "@mui/icons-material/LocationPin";

const CustomMenu = () => (
  <Menu>
    <Menu.DashboardItem />
    <Menu.ResourceItems />
    <Menu.Item
      to="/live-tracking"
      primaryText="Live Tracking"
      leftIcon={<LocationPinIcon />}
    />
  </Menu>
);

export default CustomMenu;
