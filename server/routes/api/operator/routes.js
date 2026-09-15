const express = require("express");
const router = express.Router();
const operatorApiController = require("../../../controllers/operator/controller");
const Operator = require("../../../models/operators");
const jwt = require("jsonwebtoken");

const API_PREFIX = "/" + process.env.API_VERSION + "/operator";

module.exports = function (options = {}) {
  //----------------------------------  Operators Panel APIS ----------------------------------//
  router.post(API_PREFIX + "/login", operatorApiController.operatorLogin);

  router.get(
    API_PREFIX + "/userInfo",
    verifyAuthToken,
    operatorApiController.getOperatorUserInfo,
  );

  router.put(
    API_PREFIX + "/changePassword",
    verifyAuthToken,
    operatorApiController.updateOperatorPassword,
  );

  // Operators Supports Implementations

  router.post(
    API_PREFIX + "/support",
    verifyAuthToken,
    operatorApiController.createSupport,
  );

  // Operators Feedbacks Implementations

  router.post(
    API_PREFIX + "/feedback",
    verifyAuthToken,
    operatorApiController.createFeedback,
  );

  // Operators Dashboard Stats Implementations

  router.get(API_PREFIX + "/dash-stats", verifyAuthToken, (req, res, next) => {
    operatorApiController.operatorDashboardStats(
      req,
      res,
      next,
      options.teltonikaController,
    );
  });

  // Operators Misc Implementations

  router.get(
    API_PREFIX + "/totalVehiclesOverview",
    verifyAuthToken,
    (req, res, next) => {
      operatorApiController.totalVehiclesOverview(
        req,
        res,
        next,
        options.teltonikaController,
      );
    },
  );

  router.get(
    API_PREFIX + "/full-vehicle-details/:id",
    verifyAuthToken,
    (req, res, next) => {
      operatorApiController.fullVehicleDetails(
        req,
        res,
        next,
        options.teltonikaController,
      );
    },
  );

  router.get(API_PREFIX + "/liveStd", verifyAuthToken, (req, res, next) => {
    operatorApiController.getAllLiveStd(
      req,
      res,
      next,
      options.teltonikaController,
    );
  });

  router.get(API_PREFIX + "/liveStd/:id", verifyAuthToken, (req, res, next) => {
    operatorApiController.getOneLiveStd(
      req,
      res,
      next,
      options.teltonikaController,
    );
  });

  router.get(
    API_PREFIX + "/routes/:id",
    verifyAuthToken,
    operatorApiController.getOneVRoute,
  );

  //---------------------------------- Middleware Implementations ------------------------------//

  const SECRET_KEY = process.env.JWT_SECRET;

  async function verifyAuthToken(req, res, next) {
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

  return router;
};
