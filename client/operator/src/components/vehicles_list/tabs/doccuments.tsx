import { Box, Typography } from "@mui/material";
import type { Vehicle } from "../types-vehicles";

interface Props {
  vehicle: Vehicle;
}

/* Basic Details */
const DoccumentsTab: React.FC<Props> = ({ vehicle }) => {
  return (
    <>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        📄 Vehicle Documents
      </Typography>

      <Box display="flex" flexDirection="column" gap={1.5}>
        {vehicle.documents.length > 0 ? (
          vehicle.documents.map((item) => (
            <Box
              sx={{
                backgroundColor: "#f4f4f4",
                borderLeft: `4px solid #2980b9`,
                p: 1.5,
                borderRadius: 1,
                boxShadow: 1,
              }}
            >
              <Typography sx={{ fontWeight: 500 }}>
                {item.type} Number: {item.number}
              </Typography>
              <Typography variant="body2">
                Expiry Date: {new Date(item.expiryDate).toLocaleDateString()}
              </Typography>
            </Box>
          ))
        ) : (
          <Typography variant="body2" color="text.secondary">
            No Data Provided
          </Typography>
        )}
      </Box>

      {/* 🔗 Optional Links (With Placeholder) */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          📎 Available Document Files
        </Typography>

        <Box display="flex" flexDirection="column" gap={1}>
          {vehicle.documents.length > 0 ? (
            vehicle.documents.map((doc, i) => (
              <Box
                key={i}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  backgroundColor: "#f4f4f4",
                  p: 1,
                  borderRadius: 1,
                  boxShadow: 1,
                }}
              >
                <Typography sx={{ fontWeight: 500 }}>{doc.type}:</Typography>
                {doc.url ? (
                  <a
                    href={import.meta.env.VITE_BACKEND_HOST + doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#2980b9",
                      textDecoration: "underline",
                    }}
                  >
                    View Document
                  </a>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No File Uploaded
                  </Typography>
                )}
              </Box>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">
              No Documents Uploaded
            </Typography>
          )}
        </Box>
      </Box>
    </>
  );
};

export default DoccumentsTab;
