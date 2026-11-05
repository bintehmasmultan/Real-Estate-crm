"use client";

import { deleteContact } from "@/app/actions/contacts";
import { DeleteRecordButton } from "@/components/shared/delete-record-button";

export function ContactDeleteButton({
  id,
  name,
  redirectTo,
}: {
  id: string;
  name: string;
  redirectTo?: string;
}) {
  return (
    <DeleteRecordButton
      confirmLabel={`Delete contact "${name}"?`}
      successMessage="Contact deleted"
      errorMessage="Could not delete contact"
      redirectTo={redirectTo}
      onDelete={() => deleteContact(id)}
    />
  );
}
