"use client";

import { useState, useTransition } from "react";
import { inviteToTeamAction } from "@/app/actions/teams";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type TeamOption = { id: string; name: string };

export function InviteToTeamForm({ teams }: { teams: TeamOption[] }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [gmailUrl, setGmailUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setInviteUrl(null);
    setGmailUrl(null);
    setCopied(false);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const email = String(fd.get("email") || "").trim();
    const teamId = String(fd.get("teamId") || "");
    const role = String(fd.get("role") || "AGENT");

    if (!email) {
      setError("Enter a Gmail address");
      return;
    }
    if (!teamId) {
      setError("Select a team");
      return;
    }

    startTransition(async () => {
      try {
        const result = await inviteToTeamAction({ email, teamId, role });
        if (!result.ok) {
          setError(result.message);
          return;
        }
        setMessage(result.message);
        setInviteUrl(result.inviteUrl);
        setGmailUrl(result.gmailComposeUrl);
        if (result.gmailComposeUrl) {
          window.open(result.gmailComposeUrl, "_blank", "noopener,noreferrer");
        }
        form.reset();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Invite failed");
      }
    });
  }

  async function copyLink() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-4">
        <div className="space-y-1 sm:col-span-1">
          <Label>Gmail / email</Label>
          <Input
            name="email"
            type="email"
            required
            placeholder="name@gmail.com"
          />
        </div>
        <div className="space-y-1">
          <Label>Team</Label>
          <Select name="teamId" required defaultValue="">
            <option value="" disabled>
              Select team
            </option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Role</Label>
          <Select name="role" defaultValue="AGENT">
            <option value="AGENT">Agent</option>
            <option value="MANAGER">Manager</option>
            <option value="ADMIN">Admin</option>
          </Select>
        </div>
        <div className="flex items-end">
          <Button type="submit" className="w-full" disabled={pending || teams.length === 0}>
            {pending ? "Creating invite…" : "Invite via Gmail"}
          </Button>
        </div>
      </form>
      {teams.length === 0 ? (
        <p className="text-sm text-amber-600">Create a team first, then invite.</p>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700 dark:text-emerald-300">{message}</p> : null}
      {inviteUrl ? (
        <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
          <p className="break-all text-xs text-slate-600 dark:text-slate-300">
            Invite link: {inviteUrl}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={copyLink}>
              {copied ? "Copied" : "Copy link"}
            </Button>
            {gmailUrl ? (
              <Button
                type="button"
                size="sm"
                onClick={() =>
                  window.open(gmailUrl, "_blank", "noopener,noreferrer")
                }
              >
                Open Gmail compose
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
