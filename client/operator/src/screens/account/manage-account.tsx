import {
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Box,
  Avatar,
  IconButton,
} from "@mui/material";
import { useState } from "react";
import PhotoCamera from "@mui/icons-material/PhotoCamera";

const ManageAccount = () => {
  const [formData, setFormData] = useState({
    name: "John Doe",
    email: "john@example.com",
    password: "",
    language: "en",
    notifications: true,
    avatar: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData({ ...formData, avatar: reader.result as string });
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Updated info:", formData);
    // Save to server
  };

  return (
    <Card sx={{ p: 2 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Manage Account
        </Typography>

        {/* Avatar Upload */}
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Avatar src={formData.avatar} sx={{ width: 64, height: 64 }} />
          <IconButton component="label">
            <PhotoCamera />
            <input
              hidden
              accept="image/*"
              type="file"
              onChange={handleAvatarUpload}
            />
          </IconButton>
        </Box>

        {/* Form Fields */}
        <Box
          component="form"
          onSubmit={handleSubmit}
          display="flex"
          flexDirection="column"
          gap={2}
        >
          <TextField
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="New Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            fullWidth
          />

          <Button type="submit" variant="contained" color="primary">
            Save Changes
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ManageAccount;
