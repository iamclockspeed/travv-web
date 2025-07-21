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

exports.totalVehicles = (req, res) => {
  const range = JSON.parse(req.query.range);

  console.log(range);

  const vehicles = [];

  const vehiclesActivity = ["active", "idle", "offline"];
  const vehiclesAlerts = [
    "overspeeding",
    "low battery",
    "geo fence violation",
    "crash detected",
  ];

  for (let index = range[0]; index < range[1] + 1; index++) {
    const cuAlerts = [];

    for (let j = 0; j < getRandomInt(0, 3); j++) {
      cuAlerts.push(vehiclesAlerts[getRandomInt(0, vehiclesAlerts.length - 1)]);
    }
    const vehicle = {
      id: index + 1,
      name: "Jitendra",
      vehicleNumber: "OD 15 N " + Math.floor(1000 + Math.random() * 9000),
      vehicleClass: "Mahindra 225",
      status: vehiclesActivity[getRandomInt(0, vehiclesActivity.length - 1)],
      alerts: cuAlerts,
      location: `${Math.random() * 5}, ${Math.random() * 5}`,
    };
    vehicles.push(vehicle);
  }
  res.set("Access-Control-Expose-Headers", "Content-Range");
  res.set("Content-Range", `items ${range[0]}-${range[1]}/${1000}`);
  res.status(200).json(vehicles);
};

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
