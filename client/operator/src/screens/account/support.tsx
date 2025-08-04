import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  MenuItem,
} from "@mui/material";
import { useState } from "react";

const Support = () => {
  const [form, setForm] = useState({
    subject: "",
    message: "",
    category: "general",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Support submitted:", form);
    // API call here
  };

  return (
    <Card sx={{ p: 2 }}>
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
            label="Subject"
            name="subject"
            value={form.subject}
            onChange={handleChange}
            fullWidth
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
          </TextField>

          <TextField
            label="Message"
            name="message"
            value={form.message}
            onChange={handleChange}
            multiline
            rows={5}
            fullWidth
          />

          <Button type="submit" variant="contained">
            Submit Ticket
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default Support;
