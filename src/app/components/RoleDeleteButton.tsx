"use client";

import { useRouter } from "next/navigation";

type RoleDeleteButtonProps = {
  roleId: number;
  roleTitle: string;
  huntId: number;
  className?: string;
};

export default function RoleDeleteButton({
  roleId,
  roleTitle,
  huntId,
  className = "rounded-lg border border-[color:var(--border)] px-3 py-1 text-xs text-[color:var(--muted)] transition-colors hover:border-rose-400/70 hover:text-rose-200",
}: RoleDeleteButtonProps) {
  const router = useRouter();

  async function handleDelete() {
    const confirmDelete = window.confirm(
      `Delete "${roleTitle}"? This will remove all interactions for the role.`
    );
    if (!confirmDelete) {
      return;
    }

    const response = await fetch(`/api/roles/${roleId}`, { method: "DELETE" });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      window.alert(data?.error ?? "Failed to delete role.");
      return;
    }

    router.push(`/hunts/${huntId}`);
    router.refresh();
  }

  return (
    <button type="button" onClick={handleDelete} className={className}>
      Delete role
    </button>
  );
}
