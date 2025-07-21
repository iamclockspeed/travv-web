import { useLogin, useNotify } from "react-admin";
import { useState } from "react";
import { Box, Typography, TextField, Button, Link } from "@mui/material";
import LogoImage from "../assets/logo.png";

const CustomLoginPage = () => {
  const login = useLogin();
  const notify = useNotify();
  const [form, setForm] = useState({ username: "", password: "" });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    login(form).catch(() => notify("Invalid credentials"));
  };

  return (
    <Box sx={{ position: "relative", width: "100%" }}>
      <img
        src="https://www.shutterstock.com/image-vector/3d-realistic-bus-render-illustration-600nw-2401805639.jpg"
        alt=""
        style={{
          objectFit: "cover",
          position: "fixed",
          width: "100%",
          height: "100%",
          zIndex: -1,
          opacity: 0.1,
        }}
      />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          mb: 3,
          width: "100%",
          maxWidth: 500,
          pt: 4,
          pb: 20,
          pl: 5,
          pr: 5,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            mb: 18,
          }}
        >
          <img src={LogoImage} alt="Travv Logo" style={{ width: 50 }} />
          <Typography variant="h4" color="black">
            Travv
          </Typography>
        </Box>
        <Typography variant="h4" sx={{ mt: 2, mb: 2 }}>
          Sign in to your Travv Operator account
        </Typography>
        <Typography>
          Don't have an account yet? <Link>Contact Us</Link>
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
          <TextField
            margin="normal"
            fullWidth
            type="text"
            label="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            placeholder="travv"
            required
          />
          <TextField
            margin="normal"
            fullWidth
            type="password"
            label="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="StrongPassword@123"
            required
          />
          <Link>Forgot Password?</Link>
          <Button
            type="submit"
            size="large"
            fullWidth
            variant="contained"
            sx={{ mt: 2, mb: 2, backgroundColor: "#44307C" }}
          >
            Sign In
          </Button>
          <Typography>
            By using Travv services, you agree with our{" "}
            <Link>Privacy policy</Link>.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default CustomLoginPage;
