require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const mongoose = require("mongoose");

const TeltonikaServer = require("./teltonika/teltonikaServer");
const TeltonikaController = require("./teltonika/teltonikaController");

const mainRoutes = require("./routes/mainRoutes");
const apiRoutes = require("./routes/apiRoutes");

const app = express();
const REST_PORT = process.env.REST_PORT;

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

app.listen(REST_PORT, () => {
  console.log(`Rest Server running on http://localhost:${REST_PORT}`);
});

const DB_URL = process.env.DB_URL;
const DB_PORT = process.env.DB_PORT;

mongoose
  .connect(DB_URL)
  .then(() => {
    app.listen(DB_PORT, () =>
      console.log(`DB Server running on http://localhost:${DB_PORT}`)
    );
  })
  .catch((err) => console.error("MongoDB error:", err));

function isDBConnected() {
  return mongoose.connection.readyState === 1;
}

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
