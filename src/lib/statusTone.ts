export type StatusTone =
  | "accent"
  | "yellow"
  | "red"
  | "gray"
  | "green"
  | "orange"
  | "purple";

export function getStatusTone(statusLabel: string | null): StatusTone {
  const normalized = (statusLabel ?? "").trim().toLowerCase();
  if (!normalized || normalized === "open") {
    return "yellow";
  }
  if (normalized === "accepted") {
    return "green";
  }
  if (normalized === "rejected") {
    return "red";
  }
  if (normalized === "closed") {
    return "gray";
  }
  return "accent";
}

export const STATUS_TONE_STYLES: Record<
  StatusTone,
  {
    text: string;
    gradient: string;
    cellBase: string;
    cellSelected: string;
    edge: string;
  }
> = {
  accent: {
    text: "text-cyan-100",
    gradient: "from-cyan-400/60 via-cyan-400/25 to-transparent",
    cellBase: "bg-gradient-to-br from-cyan-400/75 via-cyan-400/45 to-cyan-400/20",
    cellSelected:
      "bg-gradient-to-br from-cyan-300/95 via-cyan-300/60 to-cyan-300/25 ring-1 ring-cyan-200/80",
    edge: "from-cyan-300/90 via-cyan-300/40 to-transparent",
  },
  yellow: {
    text: "text-amber-100",
    gradient: "from-amber-400/60 via-amber-400/25 to-transparent",
    cellBase: "bg-gradient-to-br from-amber-400/75 via-amber-400/45 to-amber-400/20",
    cellSelected:
      "bg-gradient-to-br from-amber-300/95 via-amber-300/60 to-amber-300/25 ring-1 ring-amber-200/80",
    edge: "from-amber-300/90 via-amber-300/40 to-transparent",
  },
  red: {
    text: "text-rose-100",
    gradient: "from-rose-500/60 via-rose-500/25 to-transparent",
    cellBase: "bg-gradient-to-br from-rose-500/75 via-rose-500/45 to-rose-500/20",
    cellSelected:
      "bg-gradient-to-br from-rose-400/95 via-rose-400/60 to-rose-400/25 ring-1 ring-rose-300/80",
    edge: "from-rose-400/90 via-rose-400/40 to-transparent",
  },
  orange: {
    text: "text-orange-100",
    gradient: "from-orange-500/60 via-orange-500/25 to-transparent",
    cellBase:
      "bg-gradient-to-br from-orange-500/75 via-orange-500/45 to-orange-500/20",
    cellSelected:
      "bg-gradient-to-br from-orange-400/95 via-orange-400/60 to-orange-400/25 ring-1 ring-orange-300/80",
    edge: "from-orange-400/90 via-orange-400/40 to-transparent",
  },
  gray: {
    text: "text-slate-100",
    gradient: "from-slate-400/60 via-slate-400/25 to-transparent",
    cellBase: "bg-gradient-to-br from-slate-500/75 via-slate-500/45 to-slate-500/20",
    cellSelected:
      "bg-gradient-to-br from-slate-400/95 via-slate-400/60 to-slate-400/25 ring-1 ring-slate-300/80",
    edge: "from-slate-300/90 via-slate-300/40 to-transparent",
  },
  green: {
    text: "text-emerald-100",
    gradient: "from-emerald-400/60 via-emerald-400/25 to-transparent",
    cellBase:
      "bg-gradient-to-br from-emerald-400/75 via-emerald-400/45 to-emerald-400/20",
    cellSelected:
      "bg-gradient-to-br from-emerald-300/95 via-emerald-300/60 to-emerald-300/25 ring-1 ring-emerald-300/80",
    edge: "from-emerald-300/90 via-emerald-300/40 to-transparent",
  },
  purple: {
    text: "text-violet-100",
    gradient: "from-violet-400/60 via-violet-400/25 to-transparent",
    cellBase:
      "bg-gradient-to-br from-violet-500/75 via-violet-500/45 to-violet-500/20",
    cellSelected:
      "bg-gradient-to-br from-violet-300/95 via-violet-300/60 to-violet-300/25 ring-1 ring-violet-300/80",
    edge: "from-violet-300/90 via-violet-300/40 to-transparent",
  },
};
