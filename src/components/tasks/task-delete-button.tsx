"use client";

import { deleteTask } from "@/app/actions/tasks";
import { DeleteRecordButton } from "@/components/shared/delete-record-button";

export function TaskDeleteButton({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  return (
    <DeleteRecordButton
      confirmLabel={`Delete task "${title}"?`}
      successMessage="Task deleted"
      errorMessage="Could not delete task"
      onDelete={() => deleteTask(id)}
    />
  );
}
