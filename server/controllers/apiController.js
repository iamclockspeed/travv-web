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

exports.vehicles = (req, res) => {
  const vehicles = [];

  for (let index = 0; index < 10; index++) {
    const vehicle = {
      id: index,
      name: "Jitendra",
      lat: Math.random() * 5,
      lng: Math.random() * 5,
    };
    vehicles.push(vehicle);
  }
  res.set("Access-Control-Expose-Headers", "Content-Range");
  res.set("Content-Range", `items 0-9/10`);
  res.status(200).json(vehicles);
};
