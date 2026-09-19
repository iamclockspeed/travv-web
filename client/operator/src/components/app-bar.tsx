import { type FC } from "react";
import { useLocation } from "react-router-dom";
import {
  AppBar,
  UserMenu,
  MenuItemLink,
  Logout,
  LoadingIndicator,
} from "react-admin";
import { Typography, Box } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import HelpIcon from "@mui/icons-material/Help";
import FeedbackIcon from "@mui/icons-material/Feedback";
import LogoImage from "../assets/logo.png";
import routeTitles from "./routes-title";

const CustomUserMenu: FC = (props) => (
  <UserMenu {...props}>
    <MenuItemLink
      to="/manage-account"
      primaryText="Manage Account"
      leftIcon={<SettingsIcon />}
    />
    <MenuItemLink to="/support" primaryText="Support" leftIcon={<HelpIcon />} />
    <MenuItemLink
      to="/feedback"
      primaryText="Feedback"
      leftIcon={<FeedbackIcon />}
    />
    <Logout />
  </UserMenu>
);

const pathToTitle = (path: string): string => {
  if (path === "/" || !path) return "Travv Services Ltd.";

  const segments = path
    .split("/")
    .filter(Boolean)
    .map((segment) =>
      segment
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase()),
    );

  return segments.join(" / ");
};

const CustomAppBar: FC = (props) => {
  const location = useLocation();
  const path = location.pathname;
  const title = routeTitles[path] || pathToTitle(path);

  return (
    <AppBar
      {...props}
      toolbar={false}
      userMenu={<CustomUserMenu />}
      sx={{ backgroundColor: "#44307C", color: "white" }}
    >
      <Box display="flex" width="100%">
        <Box display="flex" pl={1}>
          <img
            src={LogoImage}
            title="beta(v0.1)"
            alt="Logo"
            height="30"
            style={{ marginRight: 10 }}
          />
          <Typography variant="h6" color="inherit">
            {title}
          </Typography>
        </Box>
      </Box>
      <LoadingIndicator />
    </AppBar>
  );
};

export default CustomAppBar;
