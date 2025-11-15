import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  MenuItem,
} from "@mui/material";
import { useDataProvider, useNotify } from "react-admin";

type FormState = {
  name: string;
  email: string;
  phone: string;
  category: string;
  message: string;
};

const Support: React.FC = () => {
  const dataProvider = useDataProvider();
  const notify = useNotify();

  const [_, setLoadingUser] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    category: "general",
    message: "",
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingUser(true);
        const resp = await (dataProvider as any).getUserInformation();
        if (!mounted) return;
        const u = resp?.user || resp;
        setForm((prev) => ({
          ...prev,
          name: u?.name ?? prev.name,
          email: u?.email ?? prev.email,
          phone: u?.phone ?? prev.phone,
        }));
      } catch (err) {
        console.warn("Could not load user info:", err);
      } finally {
        if (mounted) setLoadingUser(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [dataProvider]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const validate = (s: FormState) => {
    if (!s.name?.trim()) return "Please enter your name.";
    if (!s.email?.trim()) return "Please enter your email.";
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(s.email)) return "Please enter a valid email.";
    if (!s.message?.trim()) return "Please enter your message.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate(form);
    if (err) {
      notify(err, { type: "warning" });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        user: {
          name: form.name,
          email: form.email,
          phone: form.phone,
        },
        category: form.category,
        message: form.message,
      };

      const result = await (dataProvider as any).submitSupport(payload);

      notify("Support request submitted. We'll get back to you soon.", {
        type: "info",
      });

      setForm((f) => ({ ...f, message: "" }));
      console.log("submitSupport result:", result);
    } catch (error: any) {
      console.error("Submit support failed:", error);
      notify(
        error?.message ??
          "Error submitting support request — please try again later.",
        { type: "warning" }
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card sx={{ p: 2, margin: "0" }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Contact Support
        </Typography>

        <Box
          component="form"
          onSubmit={handleSubmit}
          display="flex"
          flexDirection="column"
          gap={2}
        >
          <TextField
            sx={{ display: "none" }}
            label="Name"
            name="name"
            value={form.name}
            required
            fullWidth
            disabled
          />

          <TextField
            sx={{ display: "none" }}
            label="Email"
            name="email"
            value={form.email}
            required
            fullWidth
            disabled
          />

          <TextField
            sx={{ display: "none" }}
            label="Phone"
            name="phone"
            value={form.phone}
            fullWidth
            disabled
          />

          <TextField
            label="Category"
            name="category"
            select
            value={form.category}
            onChange={handleChange}
            fullWidth
          >
            <MenuItem value="general">General</MenuItem>
            <MenuItem value="billing">Billing</MenuItem>
            <MenuItem value="technical">Technical</MenuItem>
            <MenuItem value="feature">Feature request</MenuItem>
          </TextField>

          <TextField
            label="Comments"
            name="message"
            value={form.message}
            onChange={handleChange}
            multiline
            rows={6}
            fullWidth
            required
          />

          <Box display="flex" justifyContent="flex-end" gap={1}>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              aria-label="submit-support"
            >
              {submitting ? "Submitting..." : "Submit"}
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default Support;
