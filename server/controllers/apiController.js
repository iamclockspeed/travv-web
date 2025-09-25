const jwt = require("jsonwebtoken");
const Operator = require("../models/operators");
const Vehicle = require("../models/vehicles");
const Device = require("../models/devices");
const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");

const SECRET_KEY = process.env.JWT_SECRET;

exports.operatorLogin = (req, res) => {
  if (req.body.username !== "jiten" && req.body.password !== "jiten") {
    res.status(401).json({
      error: "Invalid User and Password",
    });
  }
  const user = {
    id: 1,
    name: "Jitendra",
  };
  const token = jwt.sign(user, SECRET_KEY, { expiresIn: "1h" });
  res.status(200).json({
    token: token,
    user: user,
  });
};

exports.vehicles = (req, res) => {
  const vehicles = [];

  for (let index = 0; index < 10; index++) {
    const vehicle = {
      id: index,
      name: "Jitendra",
      lat: Math.random() * 5,
      lng: Math.random() * 5,
    };
    vehicles.push(vehicle);
  }
  res.set("Access-Control-Expose-Headers", "Content-Range");
  res.set("Content-Range", `items 0-9/10`);
  res.status(200).json(vehicles);
};

exports.totalVehicles = (req, res) => {
  const range = JSON.parse(req.query.range);

  const vehicles = [];

  const vehiclesActivity = ["active", "idle", "offline"];

  for (let index = range[0]; index < range[1] + 1; index++) {
    const vehicle = {
      id: index,
      vehicleNumber: "OD 15 N " + Math.floor(1000 + Math.random() * 9000),
      type: "Bus",
      make: "Mahindra",
      model: "225",
      status: vehiclesActivity[getRandomInt(0, vehiclesActivity.length - 1)],
      fuelType: "ev",
      location: `${(Math.random() * 8).toFixed(12)}, ${(
        Math.random() * 8
      ).toFixed(12)}`,
      alertHistory: [
        {
          type: "over speeding",
          time: "2025-08-03T08:45:00Z",
          location: "1.997776516629, 5.468399803731",
          unhandled: true,
        },
        {
          type: "low fuel",
          time: "2025-08-01T13:22:00Z",
          location: "1.997776516629, 5.468399803731",
          unhandled: true,
        },
        {
          type: "geo fence violation",
          time: "2025-08-01T13:22:00Z",
          location: "1.997776516629, 5.468399803731",
          unhandled: true,
        },
        {
          type: "unplug & towing",
          time: "2025-08-01T13:22:00Z",
          location: "1.997776516629, 5.468399803731",
          unhandled: false,
        },
      ],
      fuelLogs: [
        {
          date: "2025-08-03T08:45:00Z",
          location: "1.997776516629, 5.468399803731",
          amount: 100,
          cost: 1000,
        },
        {
          date: "2025-08-03T08:45:00Z",
          location: "1.997776516629, 5.468399803731",
          amount: 100,
          cost: 1000,
        },
        {
          date: "2025-08-03T08:45:00Z",
          location: "1.997776516629, 5.468399803731",
          amount: 100,
          cost: 1000,
        },
        {
          date: "2025-08-03T08:45:00Z",
          location: "1.997776516629, 5.468399803731",
          amount: 100,
          cost: 1000,
        },
      ],
      trips: [
        {
          from: "Delhi",
          to: "Agra",
          distance: 210, // in km
          duration: 150, // in minutes
          date: "2025-07-15T12:00:00.000Z",
        },
        {
          from: "Delhi",
          to: "Agra",
          distance: 210, // in km
          duration: 150, // in minutes
          date: "2025-07-15T12:00:00.000Z",
        },
      ],
      maintenanceLogs: [
        { date: "2024-05-30", description: "Oil Change" },
        { date: "2024-06-15", description: "Tyre Replacement" },
      ],
      documents: {
        rcNumber: "KA01AB1234",
        rcExpiry: "2026-05-30",
        fitnessExpiry: "2025-11-20",
        puccExpiry: "2024-10-15",
        insuranceExpiry: "2025-08-12",
        rcDocUrl: "/docs/rc.pdf",
        insuranceDocUrl: "/docs/insurance.pdf",
        // fitnessDocUrl: undefined
        // puccDocUrl: undefined
        // invoiceDocUrl: undefined
      },
      mainImage:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcThezfLUBEdwWoPGkwXksYE3rWZXOUTjfYNng&s",
      images: [
        "https://www.dashbus.com/wp-content/uploads/Transit-Bus-Exterior.png",
        "https://image.made-in-china.com/202f0j00fDrqOsaGuPgt/24-40-Passengers-Car-Enterprise-Commuter-Bus-Passenger-Bus-Tourist-Bus-Passenger-Car.webp",
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ-yldSwtbqpHFDRcrBGJ1Uim7HkF6GagrQ3Ne8Uh75SlyOk-0mwy8tsb-YlvJl1YW_SuI&usqp=CAU",
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSqkQVjXRiVSiI_s3CcfWVZROVhs0SeIax1oGU1gOSxYM5F_lnbCoMju_EtLdNDRB9EKGw&usqp=CAU",
      ],
    };
    vehicles.push(vehicle);
  }
  res.set("Access-Control-Expose-Headers", "Content-Range");
  res.set("Content-Range", `items ${range[0]}-${range[1]}/${1000}`);
  res.status(200).json(vehicles);
};

exports.operators = (req, res) => {
  const range = JSON.parse(req.query.range);

  const operators = [];

  for (let index = range[0]; index < range[1] + 1; index++) {
    operators.push({
      id: index,
      name: "John Doe",
      email: "john@example.com",
      status: "active",
    });
  }

  res.set("Access-Control-Expose-Headers", "Content-Range");
  res.set("Content-Range", `items ${range[0]}-${range[1]}/${1000}`);
  res.status(200).json(operators);
};

exports.vehiclesAdmin = (req, res) => {
  const range = JSON.parse(req.query.range);

  const vehicles = [];

  for (let index = range[0]; index < range[1] + 1; index++) {
    vehicles.push({
      id: index,
      plateNumber: "XYZ-123",
      status: "active",
      operatorId: 1,
    });
  }

  res.set("Access-Control-Expose-Headers", "Content-Range");
  res.set("Content-Range", `items ${range[0]}-${range[1]}/${1000}`);
  res.status(200).json(vehicles);
};

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Admin Controllers

exports.adminLogin = (req, res) => {
  if (
    req.body.username !== process.env.ADMIN_ID &&
    req.body.password !== process.env.ADMIN_PASSWPRD
  ) {
    return res.status(401).json({
      message: "Invalid Credentials",
    });
  }
  const user = {
    id: 0,
    name: process.env.ADMIN_NAME,
  };
  const token = jwt.sign(user, SECRET_KEY, { expiresIn: "1h" });
  return res.status(200).json({
    token: token,
    user: user,
  });
};

exports.createOperator = async (req, res) => {
  try {
    const operator = new Operator(req.body);

    if (req.body.password) {
      await operator.setPassword(req.body.password);
    }
    await operator.save();

    const data = { id: operator._id, ...operator.toObject() };

    return res.status(201).json(data);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

exports.countOperators = async (req, res) => {
  try {
    const total = await Operator.countDocuments();
    const active = await Operator.countDocuments({ status: "active" });
    const debarred = await Operator.countDocuments({ status: "debarred" });

    return res.json({
      ok: true,
      total,
      active,
      debarred,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.listOperators = async (req, res) => {
  try {
    const range = JSON.parse(req.query.range);
    const sort = req.query.sort ? JSON.parse(req.query.sort) : ["_id", "ASC"];
    const sortField = sort[0];
    const sortOrder = sort[1] === "DESC" ? -1 : 1;

    const operators = await Operator.find()
      .skip(range[0])
      .limit(range[1])
      .sort({ [sortField]: sortOrder });

    const total = await Operator.countDocuments();

    const data = operators.map((op) => ({
      id: op._id,
      ...op.toObject(),
    }));

    res.setHeader(
      "Content-Range",
      `operators ${range[0]}-${range[1]}/${total}`
    );
    res.setHeader("Access-Control-Expose-Headers", "Content-Range");

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getOperator = async (req, res) => {
  try {
    const operator = await Operator.findById(req.params.id);
    if (!operator) return res.status(404).json({ error: "Not found" });

    const data = { id: operator._id, ...operator.toObject() };

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.updateOperator = async (req, res) => {
  try {
    const operator = await Operator.findById(req.params.id);
    if (!operator) return res.status(404).json({ error: "Not found" });

    Object.assign(operator, req.body);

    if (req.body.password) {
      await operator.setPassword(req.body.password);
    }

    await operator.save();

    const data = { id: operator._id, ...operator.toObject() };

    return res.json(data);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

exports.deleteOperator = async (req, res) => {
  try {
    await Operator.findByIdAndDelete(req.params.id);
    return res.json({ message: "Deleted successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const operatorsComdocsDir = path.join(
  __dirname,
  "../uploads/operators/comdocs"
);
if (!fs.existsSync(operatorsComdocsDir)) {
  fs.mkdirSync(operatorsComdocsDir, { recursive: true });
}

const operatorsComdocsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, operatorsComdocsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, uuidv4() + ext);
  },
});

const operatorsComdocsUpload = multer({ storage: operatorsComdocsStorage });

exports.uploadOperatorsComdocs = [
  operatorsComdocsUpload.single("file"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const fileUrl = `/uploads/operators/comdocs/${req.file.filename}`;

    return res.json({ ok: true, url: fileUrl });
  },
];

exports.listVehicles = async (req, res) => {
  try {
    const range = JSON.parse(req.query.range);
    const sort = req.query.sort ? JSON.parse(req.query.sort) : ["_id", "ASC"];
    const sortField = sort[0];
    const sortOrder = sort[1] === "DESC" ? -1 : 1;

    const vehicles = await Vehicle.find()
      .skip(range[0])
      .limit(range[1])
      .sort({ [sortField]: sortOrder });

    const total = await Vehicle.countDocuments();

    const data = vehicles.map((op) => ({
      id: op._id,
      ...op.toObject(),
    }));

    res.setHeader("Content-Range", `vehicles ${range[0]}-${range[1]}/${total}`);
    res.setHeader("Access-Control-Expose-Headers", "Content-Range");

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
