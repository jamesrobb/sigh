"use client";

import { useRouter } from "next/navigation";

type HuntDeleteButtonProps = {
  huntId: number;
  huntName: string;
  className?: string;
};

export default function HuntDeleteButton({
  huntId,
  huntName,
  className = "rounded-lg border border-[color:var(--border)] px-3 py-1 text-xs text-[color:var(--muted)] transition-colors hover:border-rose-400/70 hover:text-rose-200",
}: HuntDeleteButtonProps) {
  const router = useRouter();

  async function handleDelete() {
    const confirmDelete = window.confirm(
      `Delete "${huntName}"? This will remove all roles and interactions in the hunt.`
    );
    if (!confirmDelete) {
      return;
    }

    const response = await fetch(`/api/hunts/${huntId}`, { method: "DELETE" });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      window.alert(data?.error ?? "Failed to delete hunt.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <button type="button" onClick={handleDelete} className={className}>
      Delete hunt
    </button>
  );
}
