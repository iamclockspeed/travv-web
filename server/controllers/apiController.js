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

  const vehicles = [];

  const vehiclesActivity = ["active", "idle", "offline"];

  for (let index = range[0]; index < range[1] + 1; index++) {
    const vehicle = {
      id: index,
      vehicleNumber: "OD 15 N " + Math.floor(1000 + Math.random() * 9000),
      type: "Bus",
      make: "Mahindra",
      model: "225",
      status: vehiclesActivity[getRandomInt(0, vehiclesActivity.length - 1)],
      fuelType: "ev",
      location: `${(Math.random() * 8).toFixed(12)}, ${(
        Math.random() * 8
      ).toFixed(12)}`,
      alertHistory: [
        {
          type: "over speeding",
          time: "2025-08-03T08:45:00Z",
          location: "1.997776516629, 5.468399803731",
          unhandled: true,
        },
        {
          type: "low fuel",
          time: "2025-08-01T13:22:00Z",
          location: "1.997776516629, 5.468399803731",
          unhandled: true,
        },
        {
          type: "geo fence violation",
          time: "2025-08-01T13:22:00Z",
          location: "1.997776516629, 5.468399803731",
          unhandled: true,
        },
        {
          type: "unplug & towing",
          time: "2025-08-01T13:22:00Z",
          location: "1.997776516629, 5.468399803731",
          unhandled: false,
        },
      ],
      mainImage:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcThezfLUBEdwWoPGkwXksYE3rWZXOUTjfYNng&s",
      images: [
        "https://www.dashbus.com/wp-content/uploads/Transit-Bus-Exterior.png",
        "https://image.made-in-china.com/202f0j00fDrqOsaGuPgt/24-40-Passengers-Car-Enterprise-Commuter-Bus-Passenger-Bus-Tourist-Bus-Passenger-Car.webp",
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ-yldSwtbqpHFDRcrBGJ1Uim7HkF6GagrQ3Ne8Uh75SlyOk-0mwy8tsb-YlvJl1YW_SuI&usqp=CAU",
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSqkQVjXRiVSiI_s3CcfWVZROVhs0SeIax1oGU1gOSxYM5F_lnbCoMju_EtLdNDRB9EKGw&usqp=CAU",
      ],
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
