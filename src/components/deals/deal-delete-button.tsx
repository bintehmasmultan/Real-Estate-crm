"use client";

import { deleteDeal } from "@/app/actions/deals";
import { DeleteRecordButton } from "@/components/shared/delete-record-button";

export function DealDeleteButton({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  return (
    <DeleteRecordButton
      confirmLabel={`Delete deal "${title}"?`}
      successMessage="Deal deleted"
      errorMessage="Could not delete deal"
      onDelete={() => deleteDeal(id)}
    />
  );
}
