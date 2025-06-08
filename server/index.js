require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const mainRoutes = require("./routes/mainRoutes");
const apiRoutes = require("./routes/apiRoutes");

const app = express();
const PORT = process.env.PORT;

app.set("view engine", "ejs");
app.set("views", "views");

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.use("/", mainRoutes);
app.use("/api", apiRoutes);

app.use((req, res) => {
  if (req.originalUrl.startsWith("/api")) {
    res.status(404).json({
      error: "Not Found",
      message: `Cannot ${req.method} ${req.originalUrl}`,
    });
  } else {
    res.status(404).render("404", { url: req.originalUrl });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
