const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Operator = require("../../models/operators");
const Vehicle = require("../../models/vehicles");
const Feedback = require("../../models/feedbacks");
const Support = require("../../models/supports");

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

exports.operatorDashboardStats = async (req, res) => {
  try {
    const operatorId = req.user.id;

    const vehicles = await Vehicle.find({ operator: operatorId })
      .select("device")
      .populate("device", "structuredTrackingData");

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

// Operators Misc

exports.totalVehiclesOverview = async (req, res) => {
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
      .populate({
        path: "device",
        match: { ...structuredFilter },
        select:
          "structuredTrackingData.status structuredTrackingData.locs structuredTrackingData.safety.alerts",
      })
      .skip(range[0])
      .limit(range[1])
      .sort({ [sortField]: sortOrder });

    const total = (
      await Vehicle.find(queryFilter)
        .select("_id")
        .populate({
          path: "device",
          match: { ...structuredFilter },
          select: "_id",
        })
    ).filter((ve) => ve.device != null).length;

    const data = vehicles
      .map((ve) => ({
        id: ve._id,
        ...ve.toObject(),
      }))
      .filter((ve) => ve.device != null);

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

exports.fullVehicleDetails = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate("device");

    if (!vehicle) return res.status(404).json({ error: "Not found" });

    const data = { id: vehicle._id, ...vehicle.toObject() };

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
