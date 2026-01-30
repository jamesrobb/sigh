"use client";

import { useRouter } from "next/navigation";

type RoleDescriptionDocumentDeleteButtonProps = {
  roleId: number;
  documentName?: string | null;
  className?: string;
};

export default function RoleDescriptionDocumentDeleteButton({
  roleId,
  documentName,
  className = "rounded-md border border-[color:var(--border)] px-2.5 py-1 text-xs font-semibold text-[color:var(--muted)] transition-colors hover:border-rose-400/70 hover:text-rose-200",
}: RoleDescriptionDocumentDeleteButtonProps) {
  const router = useRouter();

  async function handleDelete() {
    const label = documentName ? `"${documentName}"` : "this document";
    const confirmDelete = window.confirm(
      `Delete ${label} from the role description?`
    );
    if (!confirmDelete) {
      return;
    }

    const response = await fetch(`/api/roles/${roleId}/description-document`, {
      method: "DELETE",
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      window.alert(data?.error ?? "Failed to delete description document.");
      return;
    }

    router.refresh();
  }

  return (
    <button type="button" onClick={handleDelete} className={className}>
      Delete
    </button>
  );
}
