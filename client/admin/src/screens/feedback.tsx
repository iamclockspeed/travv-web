//Import Requisites
import {
  List,
  Datagrid,
  TextField,
  DateField,
  type ListProps,
  type RaRecord,
  useRecordContext,
} from "react-admin";
import { useState } from "react";
import { Button, Dialog, DialogContent, DialogTitle } from "@mui/material";

// Implementation
const FullMessageDialog = ({ text }: { text: string }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="small" onClick={() => setOpen(true)}>
        View
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Message</DialogTitle>
        <DialogContent>
          <p style={{ whiteSpace: "pre-wrap" }}>{text}</p>
        </DialogContent>
      </Dialog>
    </>
  );
};

export const TruncatedMessageField = ({ source }: { source: string }) => {
  const record = useRecordContext<RaRecord>();
  if (!record) return null;

  const value = record[source] as string;
  if (!value) return null;

  const short = value.length > 50 ? value.substring(0, 50) + "..." : value;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span>{short}</span>
      {value.length > 50 && <FullMessageDialog text={value} />}
    </div>
  );
};

export const FeedbackList: React.FC<ListProps> = (props) => (
  <List {...props} title="User Feedbacks">
    <Datagrid rowClick={false} bulkActionButtons={false}>
      <TextField source="id" />
      <TextField source="user.name" label="Name" />
      <TextField source="user.email" label="Email" />
      <TextField source="user.phone" label="Phone" />
      <TextField source="rating" label="Rating" />
      <TruncatedMessageField source="message" />
      <DateField source="createdAt" label="Submitted" />
    </Datagrid>
  </List>
);
