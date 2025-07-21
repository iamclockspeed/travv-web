const express = require("express");
const router = express.Router();
const apiController = require("../controllers/apiController");

const API_VERSION = "/" + process.env.API_VERSION;

router.post(API_VERSION + "/operator/login", apiController.operatorLogin);

router.get(API_VERSION + "/operator/vehicles", apiController.vehicles);

router.get(
  API_VERSION + "/operator/totalVehicles",
  apiController.totalVehicles
);

module.exports = router;
