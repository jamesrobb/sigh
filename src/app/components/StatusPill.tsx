type StatusPillProps = {
  status: string;
};

const statusStyles: Record<string, string> = {
  active:
    "border-emerald-300/60 text-emerald-900 bg-emerald-200/60 dark:border-emerald-400/30 dark:text-emerald-200 dark:bg-emerald-400/10",
  cancelled:
    "border-slate-300/70 text-slate-800 bg-slate-200/60 dark:border-slate-400/30 dark:text-slate-200 dark:bg-slate-400/10",
  failed:
    "border-rose-300/60 text-rose-900 bg-rose-200/60 dark:border-rose-400/30 dark:text-rose-200 dark:bg-rose-400/10",
  success:
    "border-sky-300/60 text-sky-900 bg-sky-200/60 dark:border-sky-400/30 dark:text-sky-200 dark:bg-sky-400/10",
};

export default function StatusPill({ status }: StatusPillProps) {
  const styles =
    statusStyles[status] ??
    "border-zinc-300/60 text-zinc-800 bg-zinc-200/60 dark:border-zinc-400/30 dark:text-zinc-200 dark:bg-zinc-400/10";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${styles}`}
    >
      {status}
    </span>
  );
}
