const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Operator = require("../models/operators");
const Vehicle = require("../models/vehicles");
const Device = require("../models/devices");
const DeviceMessage = require("../models/devicemessage");
const VehicleRoute = require("../models/vehicleroute");
const Feedback = require("../models/feedbacks");
const Support = require("../models/supports");
const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");

const SECRET_KEY = process.env.JWT_SECRET;

// ----- Operators Panel Controllers ------

exports.operatorLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    const operator = await Operator.findOne({
      $or: [
        { email: username },
        { phone: username },
        { profileName: username },
      ],
    });

    if (!operator) {
      return res.status(401).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, operator.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    if (operator.status != "active") {
      return res
        .status(401)
        .json({ message: "User is debarred, contact admin." });
    }

    const payload = {
      id: operator._id,
      name: operator.profileName,
      email: operator.email,
      phone: operator.phone,
    };

    const token = jwt.sign(payload, SECRET_KEY, {
      expiresIn: "1h",
    });

    return res.status(200).json({
      token: token,
      user: payload,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getOperatorUserInfo = async (req, res) => {
  try {
    const operator = await Operator.findById(req.user.id).select(
      "profileName email phone",
    );

    if (!operator) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      id: operator._id,
      ok: true,
      name: operator.profileName,
      email: operator.email,
      phone: operator.phone,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.updateOperatorPassword = async (req, res) => {
  try {
    const { newPassword: password } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    await Operator.findByIdAndUpdate(req.user.id, {
      password: password,
      passwordHash: hashed,
    });

    return res.json({ ok: true, message: "Password updated" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Operators Supports Implementations

exports.createSupport = async (req, res) => {
  try {
    const support = new Support(req.body);

    await support.save();

    const data = { id: support._id, ok: true, ...support.toObject() };

    return res.status(201).json(data);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

// Operators Feedbacks Implementations

exports.createFeedback = async (req, res) => {
  try {
    const feedback = new Feedback(req.body);

    await feedback.save();

    const data = { id: feedback._id, ok: true, ...feedback.toObject() };

    return res.status(201).json(data);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

// Operators Dashboard Stats

exports.operatorDashboardStats = async (req, res) => {
  try {
    const operatorId = req.user.id;

    const vehicles = await Vehicle.find({ operator: operatorId }).populate(
      "device",
    );

    const totalVehicles = vehicles.length;
    let activeVehicles = 0;
    let idleVehicles = 0;
    let offlineVehicles = 0;
    let crashDetected = 0;
    let overspeeding = 0;
    let violategeofence = 0;

    vehicles.forEach((vehicle) => {
      const status = vehicle.device.std?.status ?? "";
      const crashReport = vehicle.device.std?.safety?.crashDetected ?? false;

      const overspeedingReport =
        vehicle.device.std?.safety?.overspeeding ?? false;

      const violategeofenceReport =
        vehicle.device.std?.safety?.violategeofence ?? false;

      if (status == "active") {
        activeVehicles += 1;
      } else if (status == "idle") {
        idleVehicles += 1;
      } else {
        offlineVehicles += 1;
      }

      if (crashReport) {
        crashDetected += 1;
      }

      if (overspeedingReport) {
        overspeeding += 1;
      }

      if (violategeofenceReport) {
        violategeofence += 1;
      }
    });

    return res.json({
      ok: true,
      totalVehicles,
      activeVehicles,
      idleVehicles,
      offlineVehicles,
      crashDetected,
      overspeeding,
      violategeofence,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

exports.getLive = async (req, res) => {
  try {
    const operatorId = req.user.id;

    const range = JSON.parse(req.query.range);

    const vehicles = await Vehicle.find({ operator: operatorId }).populate(
      "device",
    );

    const data = [];

    vehicles.forEach((vehicle) => {
      data.push({
        id: vehicle._id,
        std: vehicle.device.std,
      });
    });

    res.setHeader(
      "Content-Range",
      `vehicles ${range[0]}-${range[1]}/${data.length}`,
    );
    res.setHeader("Access-Control-Expose-Headers", "Content-Range");

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Operators All Vehicles

exports.totalVehicles = async (req, res) => {
  try {
    const operatorId = req.user.id;

    const range = JSON.parse(req.query.range);
    const sort = req.query.sort ? JSON.parse(req.query.sort) : ["_id", "ASC"];
    const filter = req.query.filter ? JSON.parse(req.query.filter) : {};

    const vehicleFilter = {};
    const structuredFilter = {};
    const otherFilter = {};

    for (const [key, value] of Object.entries(filter)) {
      if (key === "vehicle") {
        vehicleFilter[key] = value;
      } else if (key.toLowerCase().includes("structuredtrackingdata")) {
        structuredFilter[key] = value;
      } else {
        otherFilter[key] = value;
      }
    }

    const queryFilter = {
      operator: operatorId,
    };

    const search = vehicleFilter?.vehicle?.trim();

    if (search) {
      queryFilter.$or = [
        { registrationNumber: { $regex: search, $options: "i" } },
        { make: { $regex: search, $options: "i" } },
        { model: { $regex: search, $options: "i" } },
      ];
    }

    const sortField = sort[0];
    const sortOrder = sort[1] === "DESC" ? -1 : 1;

    const vehicles = await Vehicle.find(queryFilter)
      .populate({
        path: "device",
        match: { ...structuredFilter },
      })
      .populate("operator")
      .skip(range[0])
      .limit(range[1])
      .sort({ [sortField]: sortOrder });

    const total = await Vehicle.countDocuments();

    const data = vehicles
      .map((op) => ({
        id: op._id,
        ...op.toObject(),
      }))
      .filter((op) => op.device != null);

    res.setHeader("Content-Range", `vehicles ${range[0]}-${range[1]}/${total}`);
    res.setHeader("Access-Control-Expose-Headers", "Content-Range");

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ----- Admin Controllers ------

exports.adminLogin = (req, res) => {
  if (
    req.body.username !== process.env.ADMIN_ID ||
    req.body.password !== process.env.ADMIN_PASSWORD
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

// Operators Implementations

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

    return res.json({
      ok: true,
      total,
      active,
      debarred: total - active,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.listOperators = async (req, res) => {
  try {
    const range = JSON.parse(req.query.range);
    const sort = req.query.sort ? JSON.parse(req.query.sort) : ["_id", "ASC"];
    const filter = req.query.filter ? JSON.parse(req.query.filter) : {};

    const sortField = sort[0];
    const sortOrder = sort[1] === "DESC" ? -1 : 1;

    const operators = await Operator.find(filter)
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
      `operators ${range[0]}-${range[1]}/${total}`,
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
  "../uploads/operators/comdocs",
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

// Vehicles Implementations

exports.createVehicle = async (req, res) => {
  try {
    const { device: deviceId, operator: operatorId, ...vehicleData } = req.body;

    let device = null;

    if (deviceId) {
      device = await Device.findById(deviceId);
      if (!device) throw new Error("Device not found");
      if (device.vehicle) throw new Error("Device already in use");
    }

    const vehicle = new Vehicle({
      ...vehicleData,
      operator: operatorId,
      device: deviceId,
    });

    await vehicle.save();

    if (device) {
      device.vehicle = vehicle._id;
      await device.save();
    }

    const data = { id: vehicle._id, ...vehicle.toObject() };

    return res.status(201).json(data);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

exports.countVehicles = async (req, res) => {
  try {
    const total = await Vehicle.countDocuments();

    const active = await Device.countDocuments({
      "std.status": "active",
    });

    return res.json({
      ok: true,
      total,
      active,
      offline: total - active,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.listVehicles = async (req, res) => {
  try {
    const range = JSON.parse(req.query.range);
    const sort = req.query.sort ? JSON.parse(req.query.sort) : ["_id", "ASC"];
    const filter = req.query.filter ? JSON.parse(req.query.filter) : {};

    const sortField = sort[0];
    const sortOrder = sort[1] === "DESC" ? -1 : 1;

    const vehicles = await Vehicle.find(filter)
      .populate("device")
      .populate("operator")
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

exports.getVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate("device")
      .populate("operator");

    if (!vehicle) return res.status(404).json({ error: "Not found" });

    const data = { id: vehicle._id, ...vehicle.toObject() };

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.updateVehicle = async (req, res) => {
  try {
    const { device: deviceId, operator: operatorId, ...updateData } = req.body;

    let vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });

    if (
      Object.prototype.toString.call(deviceId) !== "[object Object]" &&
      deviceId !== undefined
    ) {
      if (vehicle.device && vehicle.device.toString() !== deviceId) {
        const oldDevice = await Device.findById(vehicle.device);
        if (oldDevice) {
          oldDevice.vehicle = null;
          await oldDevice.save();
        }
      }

      if (deviceId) {
        const newDevice = await Device.findById(deviceId);
        if (!newDevice) throw new Error("Device not found");
        if (newDevice.vehicle) throw new Error("Device already in use");

        vehicle.device = newDevice._id;

        newDevice.vehicle = vehicle._id;
        await newDevice.save();
      } else {
        vehicle.device = null;
      }
    }

    if (
      operatorId &&
      Object.prototype.toString.call(operatorId) !== "[object Object]"
    ) {
      vehicle.operator = operatorId;
    }

    Object.assign(vehicle, updateData);

    await vehicle.save();

    const data = { id: vehicle._id, ...vehicle.toObject() };

    return res.json(data);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

exports.deleteVehicle = async (req, res) => {
  try {
    await Vehicle.findByIdAndDelete(req.params.id);
    return res.json({ message: "Deleted successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const vehiclesDocsDir = path.join(__dirname, "../uploads/vehicles/docs");
if (!fs.existsSync(vehiclesDocsDir)) {
  fs.mkdirSync(vehiclesDocsDir, { recursive: true });
}

const vehiclesDocsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, vehiclesDocsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, uuidv4() + ext);
  },
});

const vehiclesDocsUpload = multer({ storage: vehiclesDocsStorage });

exports.uploadVehiclesDocs = [
  vehiclesDocsUpload.single("file"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const fileUrl = `/uploads/vehicles/docs/${req.file.filename}`;

    return res.json({ ok: true, url: fileUrl });
  },
];

const vehiclesImagesDir = path.join(__dirname, "../uploads/vehicles/images");
if (!fs.existsSync(vehiclesImagesDir)) {
  fs.mkdirSync(vehiclesImagesDir, { recursive: true });
}

const vehiclesImagesStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, vehiclesImagesDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, uuidv4() + ext);
  },
});

const vehiclesImagesUpload = multer({ storage: vehiclesImagesStorage });

exports.uploadVehiclesImages = [
  vehiclesImagesUpload.single("file"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const fileUrl = `/uploads/vehicles/images/${req.file.filename}`;

    return res.json({ ok: true, url: fileUrl });
  },
];

// Devices Implementations

exports.createDevice = async (req, res) => {
  try {
    const device = new Device(req.body);

    await device.save();

    const data = {
      id: device._id,
      ...device.toObject(),
      structuredTrackingData: { status: "offline" },
    };

    return res.status(201).json(data);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

exports.countDevices = async (req, res) => {
  try {
    const total = await Device.countDocuments();
    const used = await Device.countDocuments({
      vehicle: { $ne: null, $exists: true },
    });

    return res.json({
      ok: true,
      total,
      used,
      unused: total - used,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getDevice = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id).populate("vehicle");
    if (!device) return res.status(404).json({ error: "Not found" });

    const data = { id: device._id, ...device.toObject() };

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.listDevices = async (req, res) => {
  try {
    const range = JSON.parse(req.query.range);
    const sort = req.query.sort ? JSON.parse(req.query.sort) : ["_id", "ASC"];
    const filter = req.query.filter ? JSON.parse(req.query.filter) : {};

    const sortField = sort[0];
    const sortOrder = sort[1] === "DESC" ? -1 : 1;

    const devices = await Device.find(filter)
      .skip(range[0])
      .limit(range[1])
      .sort({ [sortField]: sortOrder });

    const total = await Device.countDocuments();

    const data = devices.map((op) => ({
      id: op._id,
      ...op.toObject(),
    }));

    res.setHeader("Content-Range", `devices ${range[0]}-${range[1]}/${total}`);
    res.setHeader("Access-Control-Expose-Headers", "Content-Range");

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.updateDevice = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) return res.status(404).json({ error: "Not found" });

    Object.assign(device, req.body);

    await device.save();

    const data = { id: device._id, ...device.toObject() };

    return res.json(data);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

exports.deleteDevice = async (req, res) => {
  try {
    await Device.findByIdAndDelete(req.params.id);
    return res.json({ message: "Deleted successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Routes Implementations

exports.createVRoute = async (req, res) => {
  try {
    const vRoute = new VehicleRoute(req.body);

    await vRoute.save();

    const data = {
      id: vRoute._id,
      ...vRoute.toObject(),
    };

    return res.status(201).json(data);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

exports.countVRoutes = async (req, res) => {
  try {
    const total = await VehicleRoute.countDocuments();

    return res.json({
      ok: true,
      total,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getVRoute = async (req, res) => {
  try {
    const vRoute = await VehicleRoute.findById(req.params.id);
    if (!vRoute) return res.status(404).json({ error: "Not found" });

    const data = { id: vRoute._id, ...vRoute.toObject() };

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.listVRoutes = async (req, res) => {
  try {
    const range = JSON.parse(req.query.range);
    const sort = req.query.sort ? JSON.parse(req.query.sort) : ["_id", "ASC"];
    const filter = req.query.filter ? JSON.parse(req.query.filter) : {};

    const sortField = sort[0];
    const sortOrder = sort[1] === "DESC" ? -1 : 1;

    const vRoutes = await VehicleRoute.find(filter)
      .skip(range[0])
      .limit(range[1])
      .sort({ [sortField]: sortOrder });

    const total = await VehicleRoute.countDocuments();

    const data = vRoutes.map((op) => ({
      id: op._id,
      ...op.toObject(),
    }));

    res.setHeader("Content-Range", `devices ${range[0]}-${range[1]}/${total}`);
    res.setHeader("Access-Control-Expose-Headers", "Content-Range");

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.updateVRoute = async (req, res) => {
  try {
    const vRoute = await VehicleRoute.findById(req.params.id);
    if (!vRoute) return res.status(404).json({ error: "Not found" });

    Object.assign(vRoute, req.body);

    await vRoute.save();

    const data = { id: vRoute._id, ...vRoute.toObject() };

    return res.json(data);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

exports.deleteVRoute = async (req, res) => {
  try {
    await VehicleRoute.findByIdAndDelete(req.params.id);
    return res.json({ message: "Deleted successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Feedbacks Implementations

exports.listFeedbacks = async (req, res) => {
  try {
    const range = JSON.parse(req.query.range);
    const sort = req.query.sort ? JSON.parse(req.query.sort) : ["_id", "ASC"];
    const filter = req.query.filter ? JSON.parse(req.query.filter) : {};

    const sortField = sort[0];
    const sortOrder = sort[1] === "DESC" ? -1 : 1;

    const feedbacks = await Feedback.find(filter)
      .skip(range[0])
      .limit(range[1])
      .sort({ [sortField]: sortOrder });

    const total = await Feedback.countDocuments();

    const data = feedbacks.map((op) => ({
      id: op._id,
      ...op.toObject(),
    }));

    res.setHeader(
      "Content-Range",
      `feedbacks ${range[0]}-${range[1]}/${total}`,
    );
    res.setHeader("Access-Control-Expose-Headers", "Content-Range");

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Supports Implementations

exports.listSupports = async (req, res) => {
  try {
    const range = JSON.parse(req.query.range);
    const sort = req.query.sort ? JSON.parse(req.query.sort) : ["_id", "ASC"];
    const filter = req.query.filter ? JSON.parse(req.query.filter) : {};

    const sortField = sort[0];
    const sortOrder = sort[1] === "DESC" ? -1 : 1;

    const supports = await Support.find(filter)
      .skip(range[0])
      .limit(range[1])
      .sort({ [sortField]: sortOrder });

    const total = await Support.countDocuments();

    const data = supports.map((op) => ({
      id: op._id,
      ...op.toObject(),
    }));

    res.setHeader("Content-Range", `supports ${range[0]}-${range[1]}/${total}`);
    res.setHeader("Access-Control-Expose-Headers", "Content-Range");

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
