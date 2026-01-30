"use client";

import { useEffect, useRef, useState } from "react";
import RoleForm from "@/app/components/RoleForm";

type RoleCreateModalProps = {
  huntId: number;
  triggerLabel?: string;
  triggerHint?: string | null;
  enableShortcut?: boolean;
  triggerClassName?: string;
  triggerContainerClassName?: string;
};

export default function RoleCreateModal({
  huntId,
  triggerLabel = "Create role",
  triggerHint = "Press 'c' to create to add role or click",
  enableShortcut = true,
  triggerClassName = "rounded-lg border border-[color:var(--border)] px-3 py-1 text-xs text-[color:var(--muted)] transition-colors hover:border-[color:var(--accent)] hover:text-[color:var(--foreground)]",
  triggerContainerClassName = "flex flex-wrap items-center gap-2 text-xs text-[color:var(--muted)]",
}: RoleCreateModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const companyInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!enableShortcut) {
      return;
    }

    function handleShortcut(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "c") {
        return;
      }
      if (isOpen) {
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      event.preventDefault();
      setIsOpen(true);
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [enableShortcut, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    requestAnimationFrame(() => {
      companyInputRef.current?.focus();
    });
  }, [isOpen]);

  return (
    <>
      <div className={triggerContainerClassName}>
        {triggerHint ? <span>{triggerHint}</span> : null}
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={triggerClassName}
        >
          {triggerLabel}
        </button>
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-10">
          <button
            type="button"
            aria-label="Close modal"
            className="absolute inset-0 z-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-2xl ring-1 ring-[color:var(--accent)]/30">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold text-[color:var(--foreground)]">
                Create role
              </h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-sm text-[color:var(--muted)] transition-colors hover:text-[color:var(--foreground)]"
              >
                Close
              </button>
            </div>

            <div className="mt-6">
              <RoleForm
                huntId={huntId}
                variant="plain"
                companyInputRef={companyInputRef}
                autoFocusCompany
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
