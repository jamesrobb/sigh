"use client";

import { useRouter } from "next/navigation";

type PersonDeleteButtonProps = {
  personId: number;
  personName: string;
  className?: string;
};

export default function PersonDeleteButton({
  personId,
  personName,
  className =
    "rounded-lg border border-[color:var(--border)] px-3 py-1 text-xs text-[color:var(--muted)] transition-colors hover:border-rose-400/70 hover:text-rose-200",
}: PersonDeleteButtonProps) {
  const router = useRouter();

  async function handleDelete() {
    const confirmDelete = window.confirm(
      `Delete "${personName}"? This will remove the person's interactions and unlink them from role interactions.`
    );
    if (!confirmDelete) {
      return;
    }

    const response = await fetch(`/api/people/${personId}`, { method: "DELETE" });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      window.alert(data?.error ?? "Failed to delete person.");
      return;
    }

    router.push("/people");
    router.refresh();
  }

  return (
    <button type="button" onClick={handleDelete} className={className}>
      Delete person
    </button>
  );
}
