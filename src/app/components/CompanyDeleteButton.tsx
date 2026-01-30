"use client";

import { useRouter } from "next/navigation";

type CompanyDeleteButtonProps = {
  companyId: number;
  companyName: string;
  className?: string;
};

export default function CompanyDeleteButton({
  companyId,
  companyName,
  className =
    "rounded-lg border border-[color:var(--border)] px-3 py-1 text-xs text-[color:var(--muted)] transition-colors hover:border-rose-400/70 hover:text-rose-200",
}: CompanyDeleteButtonProps) {
  const router = useRouter();

  async function handleDelete() {
    const confirmDelete = window.confirm(
      `Delete company "${companyName}"? This will delete all associated roles, people, and all interactions associated with those roles and people.`
    );
    if (!confirmDelete) {
      return;
    }

    const response = await fetch(`/api/companies/${companyId}`, {
      method: "DELETE",
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      window.alert(data?.error ?? "Failed to delete company.");
      return;
    }

    router.push("/companies");
    router.refresh();
  }

  return (
    <button type="button" onClick={handleDelete} className={className}>
      Delete company
    </button>
  );
}
