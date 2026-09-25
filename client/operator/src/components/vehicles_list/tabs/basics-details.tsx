import { Box, Typography } from "@mui/material";
import Slider from "react-slick";
import {
  FuelTypeBadge,
  StatusWithIcon,
  LocationWithLink,
} from "./../utilities";
import type { Vehicle } from "../types-vehicles";

interface Props {
  vehicle: Vehicle;
}

/* Basic Details */
const BasicDetailsTab: React.FC<Props> = ({ vehicle }) => {
  return (
    <Box display="flex" flexDirection="column" gap={1}>
      <Typography>Vehicle Number: {vehicle.registrationNumber}</Typography>
      <Typography>Type: {vehicle.type}</Typography>
      <Typography>
        Make / Model: {vehicle.make} {vehicle.model}
      </Typography>
      <Typography>
        Fuel: <FuelTypeBadge fuelType={vehicle.fuelType} />
      </Typography>
      <Typography>
        Status:{" "}
        <StatusWithIcon
          status={vehicle.device?.structuredTrackingData?.general?.status}
        />
      </Typography>
      <Typography sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        Location:
        <LocationWithLink vehicle={vehicle} />
      </Typography>
      {vehicle.images.length > 0 && (
        <Box sx={{ pb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Vehicle Images:
          </Typography>
          <Slider
            dots
            infinite={vehicle.images.length > 1}
            speed={500}
            slidesToShow={1}
            slidesToScroll={1}
            arrows={false}
          >
            {vehicle.images.map((src, i) => (
              <Box key={i}>
                <img
                  src={import.meta.env.VITE_BACKEND_HOST + src.url}
                  alt={`${src.description}`}
                  title={`${src.description}`}
                  style={{
                    width: "100%",
                    height: 300,
                    objectFit: "contain",
                  }}
                />
              </Box>
            ))}
          </Slider>
        </Box>
      )}
    </Box>
  );
};

export default BasicDetailsTab;
