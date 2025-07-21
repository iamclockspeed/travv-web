import type { ReactNode } from "react";
import { Card, CardContent, Typography, Box, ButtonBase } from "@mui/material";

interface DashCardProps {
  v1: string | number;
  v2: string | number;
  icon: ReactNode;
  onClick?: () => void;
}

const DashCard = ({ v1, v2, icon, onClick }: DashCardProps) => {
  return (
    <ButtonBase onClick={onClick} sx={{ textAlign: "left" }}>
      <Card sx={{ width: "100%" }}>
        <CardContent sx={{ display: "flex", alignItems: "center", gap: 4 }}>
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
