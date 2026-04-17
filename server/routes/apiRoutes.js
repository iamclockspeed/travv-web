const express = require("express");
const router = express.Router();
const apiController = require("../controllers/apiController");
const Operator = require("../models/operators");
const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.JWT_SECRET;

const API_VERSION = "/" + process.env.API_VERSION;

// --------- Operators Panel APIS ------------

router.post(API_VERSION + "/operator/login", apiController.operatorLogin);

router.get(
  API_VERSION + "/operator/userInfo",
  verifyOperatorToken,
  apiController.getOperatorUserInfo,
);

router.put(
  API_VERSION + "/operator/changePassword",
  verifyOperatorToken,
  apiController.updateOperatorPassword,
);

// Operators Supports Implementations

router.post(
  API_VERSION + "/operator/support",
  verifyOperatorToken,
  apiController.createSupport,
);

// Operators Feedbacks Implementations

router.post(
  API_VERSION + "/operator/feedback",
  verifyOperatorToken,
  apiController.createFeedback,
);

// Operators Dashboard Stats Implementations

router.get(
  API_VERSION + "/operator/dash-stats",
  verifyOperatorToken,
  apiController.operatorDashboardStats,
);

router.get(
  API_VERSION + "/operator/live",
  verifyOperatorToken,
  apiController.getLive,
);

router.get(
  API_VERSION + "/operator/totalVehicles",
  verifyOperatorToken,
  apiController.totalVehicles,
);

// --------- Admin APIS ------------

router.post(API_VERSION + "/admin/login", apiController.adminLogin);

// Operators Implementations

router.get(
  API_VERSION + "/admin/operators/count",
  verifyAdminToken,
  apiController.countOperators,
);

router.get(
  API_VERSION + "/admin/operators",
  verifyAdminToken,
  apiController.listOperators,
);

router.get(
  API_VERSION + "/admin/operators/:id",
  verifyAdminToken,
  apiController.getOperator,
);

router.post(
  API_VERSION + "/admin/operators",
  verifyAdminToken,
  apiController.createOperator,
);

router.put(
  API_VERSION + "/admin/operators/:id",
  verifyAdminToken,
  apiController.updateOperator,
);

router.delete(
  API_VERSION + "/admin/operators/:id",
  verifyAdminToken,
  apiController.deleteOperator,
);

router.post(
  API_VERSION + "/admin/operators/comdocs/upload",
  verifyAdminToken,
  apiController.uploadOperatorsComdocs,
);

// Vehicles Implementations

router.get(
  API_VERSION + "/admin/vehicles/count",
  verifyAdminToken,
  apiController.countVehicles,
);

router.get(
  API_VERSION + "/admin/vehicles",
  verifyAdminToken,
  apiController.listVehicles,
);

router.get(
  API_VERSION + "/admin/vehicles/:id",
  verifyAdminToken,
  apiController.getVehicle,
);

router.post(
  API_VERSION + "/admin/vehicles",
  verifyAdminToken,
  apiController.createVehicle,
);

router.put(
  API_VERSION + "/admin/vehicles/:id",
  verifyAdminToken,
  apiController.updateVehicle,
);

router.delete(
  API_VERSION + "/admin/vehicles/:id",
  verifyAdminToken,
  apiController.deleteVehicle,
);

router.post(
  API_VERSION + "/admin/vehicles/docs/upload",
  verifyAdminToken,
  apiController.uploadVehiclesDocs,
);

router.post(
  API_VERSION + "/admin/vehicles/images/upload",
  verifyAdminToken,
  apiController.uploadVehiclesImages,
);

// Devices Implementations

router.get(
  API_VERSION + "/admin/devices/count",
  verifyAdminToken,
  apiController.countDevices,
);

router.get(
  API_VERSION + "/admin/devices",
  verifyAdminToken,
  apiController.listDevices,
);

router.get(
  API_VERSION + "/admin/devices/:id",
  verifyAdminToken,
  apiController.getDevice,
);

router.post(
  API_VERSION + "/admin/devices",
  verifyAdminToken,
  apiController.createDevice,
);

router.put(
  API_VERSION + "/admin/devices/:id",
  verifyAdminToken,
  apiController.updateDevice,
);

router.delete(
  API_VERSION + "/admin/devices/:id",
  verifyAdminToken,
  apiController.deleteDevice,
);

// Routes Implementations

router.get(
  API_VERSION + "/admin/routes/count",
  verifyAdminToken,
  apiController.countVRoutes,
);

router.get(
  API_VERSION + "/admin/routes",
  verifyAdminToken,
  apiController.listVRoutes,
);

router.get(
  API_VERSION + "/admin/routes/:id",
  verifyAdminToken,
  apiController.getVRoute,
);

router.post(
  API_VERSION + "/admin/routes",
  verifyAdminToken,
  apiController.createVRoute,
);

router.put(
  API_VERSION + "/admin/routes/:id",
  verifyAdminToken,
  apiController.updateVRoute,
);

router.delete(
  API_VERSION + "/admin/routes/:id",
  verifyAdminToken,
  apiController.deleteVRoute,
);

// Feedbacks Implementations

router.get(
  API_VERSION + "/admin/feedbacks",
  verifyAdminToken,
  apiController.listFeedbacks,
);

// Supports Implementations

router.get(
  API_VERSION + "/admin/supports",
  verifyAdminToken,
  apiController.listSupports,
);

// Others Implementations

function verifyAdminToken(req, res, next) {
  const authHeader = req.headers["authorization"];

  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token missing" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);

    if (decoded.name === process.env.ADMIN_NAME) {
      req.user = decoded;
      return next();
    }

    return res.status(403).json({ message: "Not authorized as admin" });
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
}

async function verifyOperatorToken(req, res, next) {
  const authHeader = req.headers["authorization"];

  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token missing" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);

    const operatorId = decoded.id;

    const operator = await Operator.findById(operatorId);

    if (!operator) {
      return res.status(404).json({ message: "Operator not found" });
    }

    if (operator.status !== "active") {
      return res.status(403).json({ message: "Operator is not active" });
    }

    req.user = operator;
    return next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
}

module.exports = router;
