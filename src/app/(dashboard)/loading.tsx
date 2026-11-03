export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 rounded-lg bg-slate-200 dark:bg-slate-800" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-slate-200 dark:bg-slate-800" />
        ))}
      </div>
      <div className="h-72 rounded-xl bg-slate-200 dark:bg-slate-800" />
    </div>
  );
}
