"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIos() {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // @ts-expect-error iOS Safari
    Boolean(window.navigator.standalone)
  );
}

const DISMISS_KEY = "estatecrm-install-dismissed";
const DISMISS_EVENT = "estatecrm-install-dismiss";

function subscribeDismiss(onStoreChange: () => void) {
  window.addEventListener(DISMISS_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(DISMISS_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function readDismissed() {
  return localStorage.getItem(DISMISS_KEY) === "1";
}

function subscribeIosTip(onStoreChange: () => void) {
  window.addEventListener(DISMISS_EVENT, onStoreChange);
  return () => window.removeEventListener(DISMISS_EVENT, onStoreChange);
}

function readIosTip() {
  return isIos() && !isStandalone();
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const dismissed = useSyncExternalStore(subscribeDismiss, readDismissed, () => true);
  const showIosTip = useSyncExternalStore(subscribeIosTip, readIosTip, () => false);

  useEffect(() => {
    if (isStandalone()) return;

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    window.dispatchEvent(new Event(DISMISS_EVENT));
    setDeferred(null);
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  }

  if (dismissed || isStandalone()) return null;
  if (!deferred && !showIosTip) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-40 flex justify-center px-3 lg:bottom-6">
      <div className="pointer-events-auto flex max-w-md items-start gap-3 rounded-xl border border-emerald-200 bg-white p-3 shadow-lg dark:border-emerald-900 dark:bg-slate-900">
        <div className="mt-0.5 rounded-lg bg-emerald-50 p-2 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          {deferred ? <Download className="h-4 w-4" /> : <Share className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Install EstateCRM</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {deferred
              ? "Add the app to your home screen for faster access."
              : "On iPhone: tap Share, then “Add to Home Screen”."}
          </p>
          {deferred ? (
            <Button size="sm" className="mt-2" onClick={install}>
              Install app
            </Button>
          ) : null}
        </div>
        <button
          type="button"
          aria-label="Dismiss"
          className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          onClick={dismiss}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
