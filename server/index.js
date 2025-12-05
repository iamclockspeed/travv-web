require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const mongoose = require("mongoose");

const TeltonikaServer = require("./teltonikaServer");
// const TeltonikaMessage = require("./models/TeltonikaMessage");

const Device = require("./models/devices");

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

tracker.on("message", async ({ meta, payload, raw }) => {
  try {
    const deviceIMEI = meta.deviceIMEI;

    if (!isDBConnected()) return;

    console.log(raw);

    await Device.updateOne(
      { imei: deviceIMEI },
      {
        $set: {
          status: "active",
          lastSeenAt: new Date(),
          raw: payload,
        },
      }
    );

    console.log(`[Teltonika] Saved message from ${deviceIMEI}`);
  } catch (err) {
    console.error("[Teltonika] failed to save message:", err);
  }
});

tracker.on("raw", ({ raw, socket }) => {
  console.warn(
    "[Teltonika] raw data received (could not parse to JSON):",
    raw && raw.slice(0, 400)
  );
});

tracker.start();

const OFFLINE_AFTER_SECONDS = 10;

setInterval(async () => {
  if (!isDBConnected()) return;

  const cutoff = new Date(Date.now() - OFFLINE_AFTER_SECONDS * 1000);

  await Device.updateMany(
    {
      lastSeenAt: { $lt: cutoff },
      status: { $ne: "offline" },
    },
    {
      $set: { status: "offline" },
    }
  );
}, 1000);
