const express = require("express");
const router = express.Router();
const mainController = require("../controllers/mainController");

router.use("/", mainController.homeStatic);
router.get("/", mainController.home);

// router.use("/app", mainController.user);
// router.get("/app/*", mainController.userFallback);

module.exports = router;
