import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Rating,
} from "@mui/material";
import { useState } from "react";

const Feedback = () => {
  const [form, setForm] = useState({
    rating: 4,
    feedback: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRatingChange = (
    e: React.SyntheticEvent,
    value: number | null
  ) => {
    setForm({ ...form, rating: value ?? 0 });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Feedback submitted:", form);
    // Send to backend
  };

  return (
    <Card sx={{ p: 2 }}>
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
          <Typography>Rate your experience:</Typography>
          <Rating
            name="rating"
            value={form.rating}
            onChange={handleRatingChange}
          />

          <TextField
            label="Feedback"
            name="feedback"
            value={form.feedback}
            onChange={handleChange}
            multiline
            rows={5}
            fullWidth
          />

          <Button type="submit" variant="contained">
            Submit Feedback
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default Feedback;
