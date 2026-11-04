"use client";

import { deleteMessage } from "@/app/actions/messages";
import { DeleteRecordButton } from "@/components/shared/delete-record-button";

export function MessageDeleteButton({
  id,
  subject,
}: {
  id: string;
  subject: string;
}) {
  return (
    <DeleteRecordButton
      confirmLabel={`Delete message "${subject}"?`}
      successMessage="Message deleted"
      errorMessage="Could not delete message"
      onDelete={() => deleteMessage(id)}
    />
  );
}
