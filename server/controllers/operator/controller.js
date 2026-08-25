const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Operator = require("../../models/operators");
const Vehicle = require("../../models/vehicles");
const Feedback = require("../../models/feedbacks");
const Support = require("../../models/supports");
const DeviceAlert = require("../../models/devicealert");

//----------------------------------  Operators Panel Functions ----------------------------------//

exports.operatorLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    const operator = await Operator.findOne(
      {
        $or: [{ email: username }, { phone: username }],
      },
      { profileName: 1, email: 1, phone: 1, passwordHash: 1, status: 1 },
    );

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

    const SECRET_KEY = process.env.JWT_SECRET;

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

exports.operatorDashboardStats = async (req, res, next, tController) => {
  try {
    const operatorId = req.user.id;

    const vehicles = await Vehicle.find({
      operator: operatorId,
      device: { $ne: null },
    })
      .select("device")
      .populate("device", "imei");

    const imeis = new Set(vehicles.map((vehicle) => vehicle.device.imei));

    const fastDataVehicles = tController.filterDevices(imeis);
    const reducedInfo = [...fastDataVehicles].reduce(
      (info, [imei, fdVehicle]) => {
        (fdVehicle.structured.alerts.list || []).forEach((alert) => {
          info.alerts[alert.message] = (info.alerts[alert.message] || 0) + 1;
        });
        info.status[fdVehicle.structured.general.status] =
          (info.status[fdVehicle.structured.general.status] || 0) + 1;
        return info;
      },
      {
        status: {},
        alerts: {},
      },
    );

    const totalVehicles = vehicles.length;
    const activeVehicles = reducedInfo.status["active"] || 0;
    const idleVehicles = reducedInfo.status["idle"] || 0;
    const parkedVehicles = reducedInfo.status["parked"] || 0;
    const offlineVehicles = reducedInfo.status["offline"] || 0;
    const overspeeding = reducedInfo.alerts["over speeding"] || 0;
    const violategeofence = reducedInfo.alerts["geofence violation"] || 0;
    const crashDetected = reducedInfo.alerts["crash detected"] || 0;
    const excessiveIdleVehicles = reducedInfo.alerts["excessive idle"] || 0;
    const lowFuelVehicles = reducedInfo.alerts["low fuel"] || 0;
    const lowBatteryVehicles = reducedInfo.alerts["low battery"] || 0;
    const unpluggedVehicles = reducedInfo.alerts["unplugged"] || 0;
    const towingVehicles = reducedInfo.alerts["towing"] || 0;

    return res.json({
      ok: true,
      totalVehicles,
      activeVehicles,
      idleVehicles,
      parkedVehicles,
      offlineVehicles,
      overspeeding,
      violategeofence,
      crashDetected,
      excessiveIdleVehicles,
      lowFuelVehicles,
      lowBatteryVehicles,
      unpluggedVehicles,
      towingVehicles,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

// Operators Misc

exports.totalVehiclesOverview = async (req, res, next, tController) => {
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
      } else if (key.startsWith("std.")) {
        structuredFilter[key] = value;
      } else {
        otherFilter[key] = value;
      }
    }

    const queryFilter = {
      operator: operatorId,
      device: { $ne: null },
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
      .select("images registrationNumber make model device")
      .populate("device", "imei")
      .sort({ [sortField]: sortOrder });

    const imeis = new Set(vehicles.map((vehicle) => vehicle.device.imei));

    const fastDataVehicles = tController.filterDevices(imeis);

    const filteredFDVs = new Map(
      [...fastDataVehicles].filter(([key, value]) => {
        for (const [oKey, oValue] of Object.entries(structuredFilter)) {
          const keys = oKey.replace("std.", "").split(".");
          const listIndex = keys.indexOf("list");

          if (listIndex !== -1) {
            const parent = keys
              .slice(0, listIndex)
              .reduce((forward, fKey) => forward?.[fKey], value.structured);

            const list = parent?.list;

            const matched = list?.some((item) => {
              const itemValue = keys
                .slice(listIndex + 1)
                .reduce((forward, fKey) => forward?.[fKey], item);

              return itemValue === oValue;
            });

            if (!matched) {
              return false;
            }
          } else {
            const cValue = keys.reduce(
              (forward, fKey) => forward?.[fKey],
              value.structured,
            );

            if (cValue !== oValue) {
              return false;
            }
          }
        }

        return true;
      }),
    );

    const total = filteredFDVs.size;

    const data = vehicles
      .map((ve) => ({
        id: ve._id,
        ...ve.toObject(),
        device: {
          ...ve.toObject().device,
          structuredTrackingData: filteredFDVs.get(ve.device.imei)?.structured,
        },
      }))
      .filter((ve) => ve.device.structuredTrackingData != null)
      .slice(range[0], range[1]);

    res.setHeader(
      "Content-Range",
      `totalVehiclesOverview ${range[0]}-${range[1]}/${total}`,
    );
    res.setHeader("Access-Control-Expose-Headers", "Content-Range");

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.fullVehicleDetails = async (req, res, next, tController) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate(
      "device",
      "imei",
    );

    if (!vehicle) return res.status(404).json({ error: "Not found" });

    const sevenDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;

    const alertHistoryFetch = await DeviceAlert.find(
      {
        "meta.imei": vehicle.device.imei,
        "meta.ts": { $gte: sevenDaysAgo },
      },
      { body: 1, _id: 0 },
    )
      .sort({ "meta.ts": -1 })
      .lean();

    const alertHistory = alertHistoryFetch.map((alert) => alert.body);

    const fastDataVehicle = tController.getDevice(vehicle.device.imei);

    const data = {
      id: vehicle._id,
      ...vehicle.toObject(),
      device: {
        ...vehicle.toObject().device,
        structuredTrackingData: fastDataVehicle?.structured,
        alertHistory,
      },
    };

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getAllLiveStd = async (req, res) => {
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

exports.getOneLiveStd = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate("device");

    const data = {
      id: vehicle._id,
      std: vehicle.device.std,
    };

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getOneVRoute = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate("routes");

    if (!vehicle) return res.status(404).json({ error: "Not found" });

    if (vehicle.routes.length <= 0)
      return res.status(404).json({ error: "Not found" });

    const data = {
      id: vehicle.routes[0]._id,
      points: vehicle.routes[0].pathData.path,
    };

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
