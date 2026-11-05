"use client";

import { deleteLead } from "@/app/actions/leads";
import { DeleteRecordButton } from "@/components/shared/delete-record-button";

export function LeadDeleteButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  return (
    <DeleteRecordButton
      confirmLabel={`Delete lead "${name}"?`}
      successMessage="Lead deleted"
      errorMessage="Could not delete lead"
      onDelete={() => deleteLead(id)}
    />
  );
}
