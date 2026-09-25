const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, ".env"),
});

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const mongoose = require("mongoose");

function isDBConnected() {
  return mongoose.connection.readyState === 1;
}

const DB_URL = process.env.DB_URL;
mongoose
  .connect(DB_URL)
  .then(() => {
    console.log(`MongoDB connected and running on ${DB_URL}`);
  })
  .catch((err) => console.error("MongoDB error:", err));

const TeltonikaServer = require("./teltonika/teltonikaServer");
const TeltonikaController = require("./teltonika/teltonikaController");

const T_PORT = process.env.TELTONIKA_PORT;
const tracker = new TeltonikaServer({
  port: T_PORT,
  db: mongoose,
  isDBConnected: isDBConnected,
});
const tController = new TeltonikaController({
  isDBConnected: isDBConnected,
});
tController.attachTracker(tracker);

const mainRoutes = require("./routes/mainRoutes");
const adminApiRoutes = require("./routes/api/admin/routes");
const operatorApiRoutes = require("./routes/api/operator/routes");

const app = express();
const REST_PORT = process.env.REST_PORT;

app.set("view engine", "ejs");
app.set("views", "views");

app.use(cors());
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.use("/", mainRoutes);
app.use("/api", adminApiRoutes({ teltonikaController: tController }));
app.use("/api", operatorApiRoutes({ teltonikaController: tController }));

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

app.listen(REST_PORT, () => {
  console.log(`Rest Server running on http://localhost:${REST_PORT}`);
});
