// ManageAccount.tsx
import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Box,
  Avatar,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import dataProvider from "../../providers/dataProvider";

type UserInfo = {
  name: string;
  email: string;
  phone?: string;
};

function stringToColor(string: string) {
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  let color = "#";
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += ("00" + value.toString(16)).slice(-2);
  }
  return color;
}

export const ManageAccount: React.FC = () => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loadingUser, setLoadingUser] = useState<boolean>(true);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [snack, setSnack] = useState<{
    open: boolean;
    severity: "success" | "error";
    message: string;
  }>({
    open: false,
    severity: "success",
    message: "",
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingUser(true);
      try {
        const result = await dataProvider.getUserInformation();

        const maybe = (result &&
          ("json" in result ? result.json : result)) as any;
        const userInfo: UserInfo = {
          name: maybe?.name ?? maybe?.fullName ?? "",
          email: maybe?.email ?? "",
          phone: maybe?.phone ?? maybe?.mobile ?? "",
        };
        if (mounted) setUser(userInfo);
      } catch (err) {
        console.error("Failed to load user info", err);
        if (mounted) {
          setSnack({
            open: true,
            severity: "error",
            message: "Failed to load user information.",
          });
        }
      } finally {
        if (mounted) setLoadingUser(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => (n ? n[0] : ""))
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "";

  const validate = () => {
    if (!password && !confirmPassword)
      return { ok: false, message: "Enter new password and confirm it." };
    if (password.length < 8)
      return {
        ok: false,
        message: "Password must be at least 8 characters long.",
      };
    if (password !== confirmPassword)
      return { ok: false, message: "Passwords do not match." };
    return { ok: true };
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const v = validate();
    if (!v.ok) {
      setSnack({
        open: true,
        severity: "error",
        message: v.message ?? "Invalid input",
      });
      return;
    }
    setSubmitting(true);
    try {
      await dataProvider.changePassword(password);
      setPassword("");
      setConfirmPassword("");
      setSnack({
        open: true,
        severity: "success",
        message: "Password changed successfully.",
      });
    } catch (err) {
      console.error("changePassword failed", err);
      setSnack({
        open: true,
        severity: "error",
        message: "Failed to change password.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card sx={{ p: 2 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Manage Account
        </Typography>

        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Avatar
            sx={{
              width: 64,
              height: 64,
              bgcolor: stringToColor(user?.name ?? ""),
            }}
          >
            {initials}
          </Avatar>
          <Box>
            {loadingUser ? (
              <CircularProgress size={20} />
            ) : (
              <Typography variant="subtitle1">
                {user?.name ?? "Unknown user"}
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary">
              Manage your account details
            </Typography>
          </Box>
        </Box>

        <TextField
          label="Name"
          value={user?.name ?? ""}
          fullWidth
          disabled
          margin="dense"
        />
        <TextField
          label="Email"
          value={user?.email ?? ""}
          fullWidth
          disabled
          margin="dense"
        />
        <TextField
          label="Phone"
          value={user?.phone ?? ""}
          fullWidth
          disabled
          margin="dense"
        />

        <Box
          component="form"
          display="flex"
          flexDirection="column"
          gap={2}
          mt={2}
          onSubmit={handleSubmit}
        >
          <TextField
            label="New Password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            margin="dense"
            disabled={submitting}
            helperText="At least 8 characters"
          />
          <TextField
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            fullWidth
            margin="dense"
            disabled={submitting}
          />
          <Box display="flex" gap={2} alignItems="center">
            <Button
              type="submit"
              variant="contained"
              onClick={handleSubmit}
              disabled={submitting || loadingUser}
            >
              {submitting ? <CircularProgress size={20} /> : "Save Changes"}
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setPassword("");
                setConfirmPassword("");
              }}
              disabled={submitting}
            >
              Reset
            </Button>
          </Box>
        </Box>
      </CardContent>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          severity={snack.severity}
          sx={{ width: "100%" }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Card>
  );
};

export default ManageAccount;
