import type { ReactNode } from "react";
import { Box, Card, CardContent, Typography } from "@mui/material";

interface DashCardProps {
  v1: string | number;
  v2: string | number;
  icon: ReactNode;
}

const DashCard = ({ v1, v2, icon }: DashCardProps) => {
  return (
    <Card>
      <CardContent sx={{ display: "flex", alignItems: "center", gap: 4 }}>
        <Box>
          <Typography variant="h5">{v1}</Typography>
          <Typography>{v2}</Typography>
        </Box>
        {icon}
      </CardContent>
    </Card>
  );
};

export { DashCard };
