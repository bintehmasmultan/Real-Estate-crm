"use client";

import { trashInboxMessage } from "@/app/actions/messages";
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
      label="Trash"
      confirmLabel={`Move "${subject}" to trash?`}
      successMessage="Moved to trash"
      errorMessage="Could not trash message"
      onDelete={() => trashInboxMessage(id)}
    />
  );
}
