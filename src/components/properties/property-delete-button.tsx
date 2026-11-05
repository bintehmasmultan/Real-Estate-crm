"use client";

import { deleteProperty } from "@/app/actions/properties";
import { DeleteRecordButton } from "@/components/shared/delete-record-button";

export function PropertyDeleteButton({
  propertyId,
  title,
}: {
  propertyId: string;
  title: string;
}) {
  return (
    <DeleteRecordButton
      confirmLabel={`Delete property "${title}"?`}
      successMessage="Property deleted"
      errorMessage="Could not delete property"
      redirectTo="/properties"
      size="default"
      onDelete={() => deleteProperty(propertyId)}
    />
  );
}
