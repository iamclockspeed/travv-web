const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.JWT_SECRET;

exports.operatorLogin = (req, res) => {
  if (req.body.username !== "jiten" && req.body.password !== "Jiten@9078") {
    res.status(401).json({
      error: "Invalid User and Password",
    });
  }
  const user = {
    id: 1,
    name: "Jitendra",
  };
  const token = jwt.sign(user, SECRET_KEY, { expiresIn: "1h" });
  res.status(200).json({
    token: token,
    user: user,
  });
};
