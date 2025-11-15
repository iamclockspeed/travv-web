import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Rating,
} from "@mui/material";
import { useDataProvider, useNotify } from "react-admin";

type FeedbackPayload = {
  user: {
    name: string;
    email: string;
    phone: string;
  };
  rating: number;
  message: string;
};

type FormState = {
  name: string;
  email: string;
  phone: string;
  rating: number;
  message: string;
};

const Feedback: React.FC = () => {
  const dataProvider = useDataProvider();
  const notify = useNotify();

  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    rating: 4,
    message: "",
  });
  const [_, setLoadingUser] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingUser(true);
        const resp = await (dataProvider as any).getUserInformation?.();
        const user = resp?.user ?? resp;
        if (!mounted) return;
        setForm((f) => ({
          ...f,
          name: user?.name ?? f.name,
          email: user?.email ?? f.email,
          phone: user?.phone ?? f.phone,
        }));
      } catch (err) {
        console.warn("Could not fetch user info:", err);
      } finally {
        if (mounted) setLoadingUser(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [dataProvider]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleRatingChange = (
    _: React.SyntheticEvent,
    value: number | null
  ) => {
    setForm((s) => ({ ...s, rating: value ?? 0 }));
  };

  const validate = (s: FormState) => {
    if (!s.name?.trim()) return "Please enter your name.";
    if (!s.email?.trim()) return "Please enter your email.";
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(s.email)) return "Please enter a valid email.";
    if (!s.message?.trim()) return "Please enter your feedback.";
    if (s.rating < 0 || s.rating > 5) return "Rating must be between 0 and 5.";
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
      const payload: FeedbackPayload = {
        user: { name: form.name, email: form.email, phone: form.phone },
        rating: form.rating,
        message: form.message.trim(),
      };

      const res = await (dataProvider as any).submitFeedback(payload);
      const createdId = res?.data?.id ?? res?.id ?? null;

      notify("Thanks for your feedback!", { type: "info" });
      console.log("Feedback created id:", createdId, "full response:", res);

      setForm((f) => ({ ...f, message: "", rating: 4 }));
    } catch (error: any) {
      console.error("Submit feedback failed:", error);
      notify(
        error?.message ?? "Failed to submit feedback. Please try again later.",
        { type: "error" }
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card sx={{ p: 2, margin: "0" }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Share Your Feedback
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

          <Typography>Rate your experience:</Typography>
          <Rating
            name="rating"
            value={form.rating}
            onChange={handleRatingChange}
            precision={1}
          />

          <TextField
            label="Feedback"
            name="message"
            value={form.message}
            onChange={handleChange}
            multiline
            rows={5}
            fullWidth
            required
            slotProps={{ htmlInput: { maxLength: 2000 } }}
            placeholder="Tell us what went well and what we can improve."
          />

          <Box display="flex" justifyContent="flex-end">
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Feedback"}
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default Feedback;
