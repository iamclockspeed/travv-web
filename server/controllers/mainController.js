const express = require("express");
const path = require("path");

exports.homeStatic = express.static("public");
exports.home = (req, res) => {
  res.render("index");
};

// exports.user = express.static(path.join(__dirname, "../client/user/build"));
// exports.userFallback = (req, res) => {
//   res.sendFile(path.join(__dirname, "../client/user/build/index.html"));
// };

// exports.admin = express.static(path.join(__dirname, "../client/admin/build"));
// exports.adminFallback = (req, res) => {
//   res.sendFile(path.join(__dirname, "../client/admin/build/index.html"));
// };

// exports.operator = express.static(
//   path.join(__dirname, "../client/operator/build")
// );
// exports.operatorFallback = (req, res) => {
//   res.sendFile(path.join(__dirname, "../client/operator/build/index.html"));
// };
