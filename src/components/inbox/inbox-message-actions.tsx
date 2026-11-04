"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Archive,
  ArchiveRestore,
  Mail,
  MailOpen,
  Reply,
  Star,
  Trash2,
  RotateCcw,
} from "lucide-react";
import {
  archiveInboxMessage,
  deleteMessage,
  markInboxMessageRead,
  markInboxMessageUnread,
  restoreInboxMessage,
  toggleInboxStar,
  trashInboxMessage,
  unarchiveInboxMessage,
} from "@/app/actions/messages";
import { Button } from "@/components/ui/button";
import { ComposeMessageModal } from "@/components/inbox/compose-message-modal";

type Option = { id: string; name: string };

export function InboxMessageActions({
  messageId,
  folder,
  unread,
  starred,
  archived,
  inTrash,
  canHardDelete,
  isRecipient,
  replyDefaults,
  recipients,
  contacts,
  properties,
  deals,
  leads,
}: {
  messageId: string;
  folder: string;
  unread: boolean;
  starred: boolean;
  archived: boolean;
  inTrash: boolean;
  canHardDelete: boolean;
  isRecipient: boolean;
  replyDefaults: {
    toUserIds: string[];
    subject: string;
    parentMessageId: string;
    contactId?: string | null;
    propertyId?: string | null;
    dealId?: string | null;
    leadId?: string | null;
  };
  recipients: Option[];
  contacts: Option[];
  properties: Option[];
  deals: Option[];
  leads: Option[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [replyOpen, setReplyOpen] = useState(false);

  function run(action: () => Promise<unknown>, ok: string) {
    startTransition(async () => {
      try {
        await action();
        toast.success(ok);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Action failed");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => setReplyOpen(true)}
      >
        <Reply className="h-3.5 w-3.5" />
        Reply
      </Button>

      <ComposeMessageModal
        recipients={recipients}
        contacts={contacts}
        properties={properties}
        deals={deals}
        leads={leads}
        open={replyOpen}
        onOpenChange={setReplyOpen}
        defaults={{
          toUserIds: replyDefaults.toUserIds,
          subject: replyDefaults.subject,
          parentMessageId: replyDefaults.parentMessageId,
          contactId: replyDefaults.contactId || undefined,
          propertyId: replyDefaults.propertyId || undefined,
          dealId: replyDefaults.dealId || undefined,
          leadId: replyDefaults.leadId || undefined,
        }}
      />

      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() =>
          run(() => toggleInboxStar(messageId), starred ? "Unstarred" : "Starred")
        }
      >
        <Star
          className={`h-3.5 w-3.5 ${starred ? "fill-amber-400 text-amber-500" : ""}`}
        />
        {starred ? "Unstar" : "Star"}
      </Button>

      {isRecipient ? (
        unread ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() =>
              run(() => markInboxMessageRead(messageId), "Marked as read")
            }
          >
            <MailOpen className="h-3.5 w-3.5" />
            Mark read
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() =>
              run(() => markInboxMessageUnread(messageId), "Marked as unread")
            }
          >
            <Mail className="h-3.5 w-3.5" />
            Mark unread
          </Button>
        )
      ) : null}

      {inTrash ? (
        <>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() =>
              run(() => restoreInboxMessage(messageId), "Restored")
            }
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restore
          </Button>
          <Button
            type="button"
            size="sm"
            variant="danger"
            disabled={pending}
            onClick={() => {
              if (!window.confirm("Permanently delete this message?")) return;
              run(
                () => deleteMessage(messageId, { permanent: true }),
                "Deleted permanently"
              );
              router.push(`/inbox?folder=${folder}`);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete forever
          </Button>
        </>
      ) : (
        <>
          {archived ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() =>
                run(() => unarchiveInboxMessage(messageId), "Moved to inbox")
              }
            >
              <ArchiveRestore className="h-3.5 w-3.5" />
              Unarchive
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() =>
                run(() => archiveInboxMessage(messageId), "Archived")
              }
            >
              <Archive className="h-3.5 w-3.5" />
              Archive
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => {
              run(() => trashInboxMessage(messageId), "Moved to trash");
              router.push(`/inbox?folder=${folder}`);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Trash
          </Button>
          {canHardDelete ? (
            <Button
              type="button"
              size="sm"
              variant="danger"
              disabled={pending}
              onClick={() => {
                if (!window.confirm("Permanently delete for everyone?")) return;
                run(
                  () => deleteMessage(messageId, { permanent: true }),
                  "Deleted"
                );
                router.push(`/inbox?folder=${folder}`);
              }}
            >
              Delete for all
            </Button>
          ) : null}
        </>
      )}
    </div>
  );
}
