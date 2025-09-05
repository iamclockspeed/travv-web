const express = require("express");
const router = express.Router();
const apiController = require("../controllers/apiController");
const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.JWT_SECRET;

const API_VERSION = "/" + process.env.API_VERSION;

// router.post(API_VERSION + "/operator/login", apiController.operatorLogin);

// router.get(API_VERSION + "/operator/vehicles", apiController.vehicles);

// router.get(
//   API_VERSION + "/operator/totalVehicles",
//   apiController.totalVehicles
// );

// Admin APIS

router.post(API_VERSION + "/admin/login", apiController.adminLogin);

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
