import { alpha } from "@mui/material/styles";
import { Card, CardContent, Typography, Box, ButtonBase } from "@mui/material";

interface DashCardProps {
  v1: string | number;
  v2: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

const DashCard = ({
  v1,
  v2,
  icon,
  onClick,
  disabled = false,
}: DashCardProps) => {
  return (
    <ButtonBase
      onClick={onClick}
      disabled={disabled}
      sx={{
        textAlign: "left",
        borderRadius: 2,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <Card
        sx={(theme) => ({
          width: "100%",
          transition: "all 0.2s ease",
          ...(disabled && {
            opacity: 0.45,
            filter: "grayscale(1)",
            backgroundColor: alpha(
              theme.palette.action.disabledBackground,
              0.5,
            ),
          }),
        })}
      >
        <CardContent
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 4,
          }}
        >
          <Box>
            <Typography variant="h5">{v1}</Typography>
            <Typography>{v2}</Typography>
          </Box>

          {icon}
        </CardContent>
      </Card>
    </ButtonBase>
  );
};

export { DashCard };
