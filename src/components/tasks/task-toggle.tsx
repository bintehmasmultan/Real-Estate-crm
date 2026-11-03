"use client";

import { useTransition } from "react";
import { toggleTaskDone } from "@/app/actions/tasks";

export function TaskToggle({ id, done }: { id: string; done: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <input
      type="checkbox"
      className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600"
      checked={done}
      disabled={pending}
      onChange={() => startTransition(() => toggleTaskDone(id))}
    />
  );
}
