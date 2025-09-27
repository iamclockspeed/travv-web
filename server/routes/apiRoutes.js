const express = require("express");
const router = express.Router();
const apiController = require("../controllers/apiController");
const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.JWT_SECRET;

const API_VERSION = "/" + process.env.API_VERSION;

router.post(API_VERSION + "/operator/login", apiController.operatorLogin);

router.get(API_VERSION + "/operator/vehicles", apiController.vehicles);

router.get(
  API_VERSION + "/operator/totalVehicles",
  apiController.totalVehicles
);

// --------- Admin APIS ------------

router.post(API_VERSION + "/admin/login", apiController.adminLogin);

// Operators Implementations

router.get(
  API_VERSION + "/admin/operators/count",
  verifyToken,
  apiController.countOperators
);

router.get(
  API_VERSION + "/admin/operators",
  verifyToken,
  apiController.listOperators
);

router.get(
  API_VERSION + "/admin/operators/:id",
  verifyToken,
  apiController.getOperator
);

router.post(
  API_VERSION + "/admin/operators",
  verifyToken,
  apiController.createOperator
);

router.put(
  API_VERSION + "/admin/operators/:id",
  verifyToken,
  apiController.updateOperator
);

router.delete(
  API_VERSION + "/admin/operators/:id",
  verifyToken,
  apiController.deleteOperator
);

router.post(
  API_VERSION + "/admin/operators/comdocs/upload",
  verifyToken,
  apiController.uploadOperatorsComdocs
);

// Vehicles Implementations

router.get(
  API_VERSION + "/admin/vehicles/count",
  verifyToken,
  apiController.countVehicles
);

router.get(
  API_VERSION + "/admin/vehicles",
  verifyToken,
  apiController.listVehicles
);

router.get(
  API_VERSION + "/admin/vehicles/:id",
  verifyToken,
  apiController.getVehicle
);

router.post(
  API_VERSION + "/admin/vehicles",
  verifyToken,
  apiController.createVehicle
);

router.put(
  API_VERSION + "/admin/vehicles/:id",
  verifyToken,
  apiController.updateVehicle
);

router.delete(
  API_VERSION + "/admin/vehicles/:id",
  verifyToken,
  apiController.deleteVehicle
);

router.post(
  API_VERSION + "/admin/vehicles/docs/upload",
  verifyToken,
  apiController.uploadVehiclesDocs
);

router.post(
  API_VERSION + "/admin/vehicles/images/upload",
  verifyToken,
  apiController.uploadVehiclesImages
);

// Devices Implementations

router.get(
  API_VERSION + "/admin/devices/count",
  verifyToken,
  apiController.countDevices
);

router.get(
  API_VERSION + "/admin/devices",
  verifyToken,
  apiController.listDevices
);

router.get(
  API_VERSION + "/admin/devices/:id",
  verifyToken,
  apiController.getDevice
);

router.post(
  API_VERSION + "/admin/devices",
  verifyToken,
  apiController.createDevice
);

router.put(
  API_VERSION + "/admin/devices/:id",
  verifyToken,
  apiController.updateDevice
);

router.delete(
  API_VERSION + "/admin/devices/:id",
  verifyToken,
  apiController.deleteDevice
);

// Others Implementations

function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];

  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token missing" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
}

module.exports = router;
