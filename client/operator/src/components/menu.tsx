import { Menu } from "react-admin";
// import AssessmentIcon from "@mui/icons-material/Assessment";
import LocationPinIcon from "@mui/icons-material/LocationPin";

const CustomMenu = () => (
  <Menu>
    <Menu.DashboardItem />
    <Menu.ResourceItems />
    {/* <Menu.Item
      to="/reports"
      primaryText="Reports"
      leftIcon={<AssessmentIcon />}
    /> */}
    <Menu.Item
      to="/live-tracking"
      primaryText="Live Tracking"
      leftIcon={<LocationPinIcon />}
    />
  </Menu>
);

export default CustomMenu;
