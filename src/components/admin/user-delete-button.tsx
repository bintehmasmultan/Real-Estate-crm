"use client";

import { deleteUserAccount } from "@/app/actions/users";
import { DeleteRecordButton } from "@/components/shared/delete-record-button";

export function UserDeleteButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  return (
    <DeleteRecordButton
      confirmLabel={`Delete user "${name}"?`}
      successMessage="User deleted"
      errorMessage="Could not delete user"
      onDelete={() => deleteUserAccount(id)}
    />
  );
}
