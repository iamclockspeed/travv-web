const express = require("express");
const router = express.Router();
const adminApiController = require("../../../controllers/admin/controller");
const jwt = require("jsonwebtoken");

const API_PREFIX = "/" + process.env.API_VERSION + "/admin";

//---------------------------------- Admin APIS ----------------------------------//

router.post(API_PREFIX + "/login", adminApiController.login);

// Operators Implementations

router.get(
  API_PREFIX + "/operators/count",
  verifyAuthToken,
  adminApiController.countOperators,
);

router.get(
  API_PREFIX + "/operators",
  verifyAuthToken,
  adminApiController.listOperators,
);

router.get(
  API_PREFIX + "/operators-lite",
  verifyAuthToken,
  adminApiController.listOperatorsLite,
);

router.get(
  API_PREFIX + "/operators/:id",
  verifyAuthToken,
  adminApiController.getOperator,
);

router.post(
  API_PREFIX + "/operators",
  verifyAuthToken,
  adminApiController.createOperator,
);

router.put(
  API_PREFIX + "/operators/:id",
  verifyAuthToken,
  adminApiController.updateOperator,
);

router.delete(
  API_PREFIX + "/operators/:id",
  verifyAuthToken,
  adminApiController.deleteOperator,
);

router.post(
  API_PREFIX + "/operators/comdocs/upload",
  verifyAuthToken,
  adminApiController.uploadOperatorsComdocs,
);

// Vehicles Implementations

router.get(
  API_PREFIX + "/vehicles/count",
  verifyAuthToken,
  adminApiController.countVehicles,
);

router.get(
  API_PREFIX + "/vehicles",
  verifyAuthToken,
  adminApiController.listVehicles,
);

router.get(
  API_PREFIX + "/vehicles/:id",
  verifyAuthToken,
  adminApiController.getVehicle,
);

router.post(
  API_PREFIX + "/vehicles",
  verifyAuthToken,
  adminApiController.createVehicle,
);

router.put(
  API_PREFIX + "/vehicles/:id",
  verifyAuthToken,
  adminApiController.updateVehicle,
);

router.delete(
  API_PREFIX + "/vehicles/:id",
  verifyAuthToken,
  adminApiController.deleteVehicle,
);

router.post(
  API_PREFIX + "/vehicles/docs/upload",
  verifyAuthToken,
  adminApiController.uploadVehiclesDocs,
);

router.post(
  API_PREFIX + "/vehicles/images/upload",
  verifyAuthToken,
  adminApiController.uploadVehiclesImages,
);

// Devices Implementations

router.get(
  API_PREFIX + "/devices/count",
  verifyAuthToken,
  adminApiController.countDevices,
);

router.get(
  API_PREFIX + "/devices",
  verifyAuthToken,
  adminApiController.listDevices,
);

router.get(
  API_PREFIX + "/devices-lite",
  verifyAuthToken,
  adminApiController.listDevicesLite,
);

router.get(
  API_PREFIX + "/devices/:id",
  verifyAuthToken,
  adminApiController.getDevice,
);

router.post(
  API_PREFIX + "/devices",
  verifyAuthToken,
  adminApiController.createDevice,
);

router.put(
  API_PREFIX + "/devices/:id",
  verifyAuthToken,
  adminApiController.updateDevice,
);

router.delete(
  API_PREFIX + "/devices/:id",
  verifyAuthToken,
  adminApiController.deleteDevice,
);

// Routes Implementations

router.get(
  API_PREFIX + "/routes/count",
  verifyAuthToken,
  adminApiController.countVRoutes,
);

router.get(
  API_PREFIX + "/routes",
  verifyAuthToken,
  adminApiController.listVRoutes,
);

router.get(
  API_PREFIX + "/routes-lite",
  verifyAuthToken,
  adminApiController.listVRoutesLite,
);

router.get(
  API_PREFIX + "/routes/:id",
  verifyAuthToken,
  adminApiController.getVRoute,
);

router.post(
  API_PREFIX + "/routes",
  verifyAuthToken,
  adminApiController.createVRoute,
);

router.put(
  API_PREFIX + "/routes/:id",
  verifyAuthToken,
  adminApiController.updateVRoute,
);

router.delete(
  API_PREFIX + "/routes/:id",
  verifyAuthToken,
  adminApiController.deleteVRoute,
);

// Feedbacks Implementations

router.get(
  API_PREFIX + "/feedbacks",
  verifyAuthToken,
  adminApiController.listFeedbacks,
);

// Supports Implementations

router.get(
  API_PREFIX + "/supports",
  verifyAuthToken,
  adminApiController.listSupports,
);

//---------------------------------- Middleware Implementations ------------------------------//

const SECRET_KEY = process.env.JWT_SECRET;

function verifyAuthToken(req, res, next) {
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

module.exports = router;
