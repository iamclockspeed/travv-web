const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Operator = require("../../models/operators");
const Vehicle = require("../../models/vehicles");
const Device = require("../../models/devices");
const VehicleRoute = require("../../models/vehicleroute");
const Feedback = require("../../models/feedbacks");
const Support = require("../../models/supports");
const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");

//---------------------------------- Admin Functions ----------------------------------//

exports.login = (req, res) => {
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
  const SECRET_KEY = process.env.JWT_SECRET;
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
      .select("fullLegalName email phone status")
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

exports.listOperatorsLite = async (req, res) => {
  try {
    const range = JSON.parse(req.query.range);
    const sort = req.query.sort ? JSON.parse(req.query.sort) : ["_id", "ASC"];
    const { selectFields, ...filter } = req.query.filter
      ? JSON.parse(req.query.filter)
      : { selectFields: "_id" };

    const sortField = sort[0];
    const sortOrder = sort[1] === "DESC" ? -1 : 1;

    const operators = await Operator.find(filter)
      .select(selectFields)
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
      `operators-lite ${range[0]}-${range[1]}/${total}`,
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
    await Vehicle.updateMany(
      { operator: req.params.id },
      { $set: { operator: null } },
    );
    await Operator.findByIdAndDelete(req.params.id);
    return res.json({ message: "Deleted successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const operatorsComdocsDir = path.join(
  __dirname,
  "../../uploads/operators/comdocs",
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
      device = await Device.findById(deviceId).select("vehicle");
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

    const offline = await Device.countDocuments({
      "structuredTrackingData.general.status": "offline",
    });

    return res.json({
      ok: true,
      total,
      active: total - offline,
      offline,
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
      .select("registrationNumber type make model fuelType device operator")
      .skip(range[0])
      .limit(range[1])
      .sort({ [sortField]: sortOrder });

    const total = await Vehicle.countDocuments();

    const data = vehicles.map((ve) => ({
      id: ve._id,
      ...ve.toObject(),
      device: ve.device != null ? "YES" : "NA",
      operator: ve.operator != null ? "YES" : "NA",
    }));

    res.setHeader("Content-Range", `vehicles ${range[0]}-${range[1]}/${total}`);
    res.setHeader("Access-Control-Expose-Headers", "Content-Range");

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.listVehiclesLite = async (req, res) => {
  try {
    const range = JSON.parse(req.query.range);
    const sort = req.query.sort ? JSON.parse(req.query.sort) : ["_id", "ASC"];
    const { selectFields, ...filter } = req.query.filter
      ? JSON.parse(req.query.filter)
      : { selectFields: "_id" };

    const sortField = sort[0];
    const sortOrder = sort[1] === "DESC" ? -1 : 1;

    const vehicles = await Vehicle.find(filter)
      .select(selectFields)
      .skip(range[0])
      .limit(range[1])
      .sort({ [sortField]: sortOrder });

    const total = await Vehicle.countDocuments();

    const data = vehicles.map((ve) => ({
      id: ve._id,
      ...ve.toObject(),
    }));

    res.setHeader(
      "Content-Range",
      `vehicles-lite ${range[0]}-${range[1]}/${total}`,
    );
    res.setHeader("Access-Control-Expose-Headers", "Content-Range");

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate(
      "routes",
      "routeName",
    );

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
        const oldDevice = await Device.findById(vehicle.device).select(
          "vehicle",
        );
        if (oldDevice) {
          oldDevice.vehicle = null;
          await oldDevice.save();
        }
      }

      if (deviceId) {
        const newDevice = await Device.findById(deviceId).select("vehicle");
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
    await Device.updateMany(
      { vehicle: req.params.id },
      { $set: { vehicle: null } },
    );
    await Vehicle.findByIdAndDelete(req.params.id);
    return res.json({ message: "Deleted successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const vehiclesDocsDir = path.join(__dirname, "../../uploads/vehicles/docs");
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

const vehiclesImagesDir = path.join(__dirname, "../../uploads/vehicles/images");
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
    const now = Date.now();
    const emptyStd = {
      alerts: {
        ts: now,
        list: [],
      },
      locs: {
        ts: now,
        lat: 0.0,
        lng: 0.0,
        alt: 0.0,
      },
      general: {
        ts: now,
        status: "offline",
        ignition: "off",
        moving: "stopped",
      },
    };

    req.body.structuredTrackingData = emptyStd;

    const device = new Device(req.body);

    await device.save();

    const data = {
      id: device._id,
      ...device.toObject(),
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
    const device = await Device.findById(req.params.id)
      .select(
        "deviceId imei simNumber model manufacturer firmwareVersion type vehicle",
      )
      .populate("vehicle", "registrationNumber");
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
      .select("deviceId imei simNumber model manufacturer firmwareVersion type")
      .skip(range[0])
      .limit(range[1])
      .sort({ [sortField]: sortOrder });

    const total = await Device.countDocuments();

    const data = devices.map((de) => ({
      id: de._id,
      ...de.toObject(),
    }));

    res.setHeader("Content-Range", `devices ${range[0]}-${range[1]}/${total}`);
    res.setHeader("Access-Control-Expose-Headers", "Content-Range");

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.listDevicesLite = async (req, res) => {
  try {
    const range = JSON.parse(req.query.range);
    const sort = req.query.sort ? JSON.parse(req.query.sort) : ["_id", "ASC"];
    const { selectFields, ...filter } = req.query.filter
      ? JSON.parse(req.query.filter)
      : { selectFields: "_id" };

    const sortField = sort[0];
    const sortOrder = sort[1] === "DESC" ? -1 : 1;

    const devices = await Device.find(filter)
      .select(selectFields)
      .skip(range[0])
      .limit(range[1])
      .sort({ [sortField]: sortOrder });

    const total = await Device.countDocuments();

    const data = devices.map((de) => ({
      id: de._id,
      ...de.toObject(),
    }));

    res.setHeader(
      "Content-Range",
      `devices-lite ${range[0]}-${range[1]}/${total}`,
    );
    res.setHeader("Access-Control-Expose-Headers", "Content-Range");

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.updateDevice = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id).select(
      "-structuredTrackingData",
    );
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
    await Vehicle.updateMany(
      { device: req.params.id },
      { $set: { device: null } },
    );
    await Device.findByIdAndDelete(req.params.id);
    return res.json({ message: "Deleted successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Routes Implementations

exports.createVRoute = async (req, res) => {
  try {
    const reqObject = req.body;

    if (reqObject.pathData) {
      reqObject.pathData = JSON.parse(reqObject.pathData);
    }

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
      .select("routeName")
      .skip(range[0])
      .limit(range[1])
      .sort({ [sortField]: sortOrder });

    const total = await VehicleRoute.countDocuments();

    const data = vRoutes.map((vr) => ({
      id: vr._id,
      ...vr.toObject(),
    }));

    res.setHeader("Content-Range", `routes ${range[0]}-${range[1]}/${total}`);
    res.setHeader("Access-Control-Expose-Headers", "Content-Range");

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.listVRoutesLite = async (req, res) => {
  try {
    const range = JSON.parse(req.query.range);
    const sort = req.query.sort ? JSON.parse(req.query.sort) : ["_id", "ASC"];
    const { selectFields, ...filter } = req.query.filter
      ? JSON.parse(req.query.filter)
      : { selectFields: "_id" };

    const sortField = sort[0];
    const sortOrder = sort[1] === "DESC" ? -1 : 1;

    const vRoutes = await VehicleRoute.find(filter)
      .select(selectFields)
      .skip(range[0])
      .limit(range[1])
      .sort({ [sortField]: sortOrder });

    const total = await VehicleRoute.countDocuments();

    const data = vRoutes.map((vr) => ({
      id: vr._id,
      ...vr.toObject(),
    }));

    res.setHeader(
      "Content-Range",
      `routes-lite ${range[0]}-${range[1]}/${total}`,
    );
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

    const reqObject = req.body;

    if (reqObject.pathData) {
      reqObject.pathData = JSON.parse(reqObject.pathData);
    }

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
    await Vehicle.updateMany(
      { routes: req.params.id },
      { $pull: { routes: req.params.id } },
    );
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

    const data = feedbacks.map((fb) => ({
      id: fb._id,
      ...fb.toObject(),
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

    const data = supports.map((sp) => ({
      id: sp._id,
      ...sp.toObject(),
    }));

    res.setHeader("Content-Range", `supports ${range[0]}-${range[1]}/${total}`);
    res.setHeader("Access-Control-Expose-Headers", "Content-Range");

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
