import { Menu } from "react-admin";
import LocationPinIcon from "@mui/icons-material/LocationPin";
import TextSnippetIcon from "@mui/icons-material/TextSnippet";
import SettingsIcon from "@mui/icons-material/Settings";

const CustomMenu = () => (
  <Menu>
    <Menu.DashboardItem />
    <Menu.ResourceItems />
    <Menu.Item
      to="/live-tracking"
      primaryText="Live Tracking"
      leftIcon={<LocationPinIcon />}
    />
    <Menu.Item
      to="/reports"
      primaryText="Reports"
      leftIcon={<TextSnippetIcon />}
    />
    <Menu.Item
      to="/settings"
      primaryText="Settings"
      leftIcon={<SettingsIcon />}
    />
  </Menu>
);

export default CustomMenu;
