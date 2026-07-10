{
  /* Trips */
}
{
  /* <TabPanel value={tabIndex} index={1}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            🚗 Trip Summary (Last 30 Days)
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2">
              Total Trips: {vehicle.trips.length}
            </Typography>
            <Typography variant="body2">
              Total Distance:{" "}
              {vehicle.trips.reduce((acc, t) => acc + t.distance, 0).toFixed(1)}{" "}
              km
            </Typography>
            <Typography variant="body2">
              Total Duration:{" "}
              {(
                vehicle.trips.reduce((acc, t) => acc + t.duration, 0) / 60
              ).toFixed(1)}{" "}
              mins
            </Typography>
            <Typography variant="body2">
              Avg. Mileage:{" "}
              {(
                vehicle.trips.reduce((acc, t) => acc + t.distance, 0) /
                (vehicle.fuelLogs.reduce((acc, f) => acc + f.amount, 0) || 1)
              ).toFixed(1)}{" "}
              km/L
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ⏳ Only trips from the last 30 days are shown
            </Typography>
          </Box>

          {vehicle.trips.length > 0 ? (
            <Box
              sx={{
                maxHeight: 300,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
                pr: 1,
              }}
            >
              {vehicle.trips.map((trip, i) => (
                <Box
                  key={i}
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 2,
                    backgroundColor: "#f4f4f4",
                    borderLeft: `4px solid #27ae60`,
                    p: 1.5,
                    borderRadius: 1,
                    boxShadow: 1,
                  }}
                >
                  <Box sx={{ fontSize: 24 }}>🧭</Box>
                  <Box flex={1}>
                    <Typography sx={{ fontWeight: 500 }}>
                      {trip.from} ➝ {trip.to}
                    </Typography>
                    <Typography variant="body2">
                      {trip.distance} km | {(trip.duration / 60).toFixed(1)}{" "}
                      mins
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      📅 {new Date(trip.date).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <Box
              sx={{
                backgroundColor: "#2ecc71",
                color: "#fff",
                px: 2,
                py: 1,
                borderRadius: 1,
                width: "fit-content",
                mt: 1,
              }}
            >
              ✅ No Trips Recorded
            </Box>
          )}
        </TabPanel> */
}

{
  /* Fuel Logs */
}
{
  /* <TabPanel value={tabIndex} index={2}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            ⛽ Fuel Logs Summary (Last 30 Days)
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2">
              Total Fills: {vehicle.fuelLogs.length}
            </Typography>
            <Typography variant="body2">
              Total Fuel:{" "}
              {vehicle.fuelLogs.reduce((acc, f) => acc + f.amount, 0)} L
            </Typography>
            <Typography variant="body2">
              Total Cost: ₹
              {vehicle.fuelLogs.reduce((acc, f) => acc + f.cost, 0)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ⏳ Only logs from the last 30 days are shown
            </Typography>
          </Box>

          {vehicle.fuelLogs.length > 0 ? (
            <Box
              sx={{
                maxHeight: 300,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
                pr: 1,
              }}
            >
              {vehicle.fuelLogs.map((log, i) => (
                <Box
                  key={i}
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 2,
                    backgroundColor: "#f4f4f4",
                    borderLeft: `4px solid #2980b9`,
                    p: 1.5,
                    borderRadius: 1,
                    boxShadow: 1,
                  }}
                >
                  <Box sx={{ fontSize: 24 }}>⛽</Box>
                  <Box flex={1}>
                    <Typography sx={{ fontWeight: 500 }}>
                      Filled {log.amount} L – ₹{log.cost}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      📅 {new Date(log.date).toLocaleString()}
                    </Typography>
                    {log.location && (
                      <Typography
                        variant="body2"
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <IconButton
                          size="small"
                          title="View on Map"
                          sx={{ p: 0.2 }}
                        >
                          <MapIcon fontSize="small" />
                        </IconButton>
                        Location
                      </Typography>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <Box
              sx={{
                backgroundColor: "#2ecc71",
                color: "#fff",
                px: 2,
                py: 1,
                borderRadius: 1,
                width: "fit-content",
                mt: 1,
              }}
            >
              ✅ No Fuel Logs
            </Box>
          )}
        </TabPanel> */
}

{
  /* Maintenance Logs */
}
{
  /* <TabPanel value={tabIndex} index={4}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            🛠️ Maintenance Summary (Last 30 Days)
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2">
              Total Maintenance Entries: {vehicle.maintenanceLogs?.length ?? 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ⏳ Only logs from the last 30 days are shown
            </Typography>
          </Box>

          {vehicle.maintenanceLogs?.length > 0 ? (
            <Box
              sx={{
                maxHeight: 300,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
                pr: 1,
              }}
            >
              {vehicle.maintenanceLogs.map((log, i) => (
                <Box
                  key={i}
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 2,
                    backgroundColor: "#f4f4f4",
                    borderLeft: `4px solid #8e44ad`,
                    p: 1.5,
                    borderRadius: 1,
                    boxShadow: 1,
                  }}
                >
                  <Box sx={{ fontSize: 24 }}>🛠️</Box>
                  <Box flex={1}>
                    <Typography sx={{ fontWeight: 500 }}>
                      {log.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      📅 {new Date(log.date).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <Box
              sx={{
                backgroundColor: "#2ecc71",
                color: "#fff",
                px: 2,
                py: 1,
                borderRadius: 1,
                width: "fit-content",
                mt: 1,
              }}
            >
              ✅ No Maintenance Logs
            </Box>
          )}
        </TabPanel> */
}
