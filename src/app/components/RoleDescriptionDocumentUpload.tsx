"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type RoleDescriptionDocumentUploadProps = {
  roleId: number;
  label?: string;
  className?: string;
};

export default function RoleDescriptionDocumentUpload({
  roleId,
  label = "Upload document",
  className =
    "rounded-md border border-[color:var(--border)] px-3 py-1 text-xs text-[color:var(--muted)] transition-colors hover:border-[color:var(--accent)] hover:text-[color:var(--foreground)]",
}: RoleDescriptionDocumentUploadProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      return;
    }
    setError(null);
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(
        `/api/roles/${roleId}/description-document`,
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to upload document.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <input
        ref={inputRef}
        type="file"
        onChange={handleChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className={className}
      >
        {isUploading ? "Uploading..." : label}
      </button>
      {error ? (
        <p className="text-xs text-rose-300 dark:text-rose-200">{error}</p>
      ) : null}
    </div>
  );
}
