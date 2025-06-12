import { AppBar, type AppBarProps } from "react-admin";
import { Typography, Box } from "@mui/material";
import LogoImage from "../assets/logo.png";

const CustomAppBar = (props: AppBarProps) => (
  <AppBar {...props} color="default">
    <Box display="flex" width="100%">
      <Box display="flex" pl={1}>
        <img
          src={LogoImage}
          alt="Logo"
          height="30"
          style={{ marginRight: 10 }}
        />
        <Typography variant="h6" color="inherit">
          Travv Services Ltd.
        </Typography>
      </Box>
    </Box>
  </AppBar>
);

export default CustomAppBar;
