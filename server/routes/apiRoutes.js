const express = require("express");
const router = express.Router();
const apiController = require("../controllers/apiController");

const API_VERSION = "/" + process.env.API_VERSION;

router.post(API_VERSION + "/operator/login", apiController.operatorLogin);

module.exports = router;
