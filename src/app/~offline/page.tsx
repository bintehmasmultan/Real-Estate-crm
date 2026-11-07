export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-emerald-50 px-6 text-center dark:bg-slate-950">
      <h1 className="text-2xl font-semibold text-emerald-800 dark:text-emerald-300">
        You&apos;re offline
      </h1>
      <p className="max-w-sm text-sm text-slate-600 dark:text-slate-400">
        BINTEHMAS Real Estate CRM needs a connection for live CRM data. Reconnect and refresh to
        continue.
      </p>
    </main>
  );
}
