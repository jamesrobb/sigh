"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import FastInput, { FastInputItem } from "@/app/components/FastInput";

type CompanyOption = {
  id: number;
  name: string;
};

type PersonEditModalProps = {
  personId: number;
  initialFirstName: string;
  initialLastName: string;
  initialCompanyId: number;
  initialCompanyName: string;
  initialTitle: string | null;
  initialEmail: string | null;
  initialLinkedin: string | null;
  initialPhone: string | null;
  companies: CompanyOption[];
  triggerLabel?: string;
  triggerClassName?: string;
};

export default function PersonEditModal({
  personId,
  initialFirstName,
  initialLastName,
  initialCompanyId,
  initialCompanyName,
  initialTitle,
  initialEmail,
  initialLinkedin,
  initialPhone,
  companies: initialCompanies,
  triggerLabel = "Edit",
  triggerClassName = "rounded-lg border border-[color:var(--border)] px-2.5 py-1 text-xs text-[color:var(--muted)] transition-colors hover:border-[color:var(--accent)] hover:text-[color:var(--foreground)]",
}: PersonEditModalProps) {
  const router = useRouter();
  const firstNameInputRef = useRef<HTMLInputElement | null>(null);
  const companyInputRef = useRef<HTMLInputElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [companies, setCompanies] = useState<CompanyOption[]>(initialCompanies);
  const [companyQuery, setCompanyQuery] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [title, setTitle] = useState(initialTitle ?? "");
  const [email, setEmail] = useState(initialEmail ?? "");
  const [linkedin, setLinkedin] = useState(initialLinkedin ?? "");
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyUrl, setNewCompanyUrl] = useState("");
  const [newCompanyLinkedin, setNewCompanyLinkedin] = useState("");
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [isSavingCompany, setIsSavingCompany] = useState(false);

  const companyItems = useMemo<FastInputItem[]>(
    () =>
      companies.map((entry) => ({
        id: entry.id,
        label: entry.name,
      })),
    [companies]
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    requestAnimationFrame(() => {
      firstNameInputRef.current?.focus();
    });
  }, [isOpen]);

  function openModal() {
    const selectedCompany =
      companies.find((entry) => entry.id === initialCompanyId) ??
      ({ id: initialCompanyId, name: initialCompanyName } as CompanyOption);
    if (!companies.some((entry) => entry.id === selectedCompany.id)) {
      setCompanies((prev) => [...prev, selectedCompany].sort((a, b) => a.id - b.id));
    }
    setFirstName(initialFirstName);
    setLastName(initialLastName);
    setTitle(initialTitle ?? "");
    setEmail(initialEmail ?? "");
    setLinkedin(initialLinkedin ?? "");
    setPhone(initialPhone ?? "");
    setSelectedCompanyId(selectedCompany.id);
    setCompanyQuery(selectedCompany.name);
    setError(null);
    setIsOpen(true);
  }

  function openCompanyModal(nameValue?: string) {
    setCompanyModalOpen(true);
    setNewCompanyName(nameValue ?? "");
    setNewCompanyUrl("");
    setNewCompanyLinkedin("");
    setCompanyError(null);
  }

  async function handleCreateCompany(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setCompanyError(null);

    const nameValue = newCompanyName.trim();
    if (!nameValue) {
      setCompanyError("Company name is required.");
      return;
    }

    setIsSavingCompany(true);
    try {
      const response = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nameValue,
          url: newCompanyUrl.trim() || null,
          linkedin: newCompanyLinkedin.trim() || null,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to create company.");
      }

      const newCompany: CompanyOption = {
        id: Number(data.id),
        name: data.name,
      };

      setCompanies((prev) => {
        const map = new Map<number, CompanyOption>();
        for (const entry of prev) {
          map.set(entry.id, entry);
        }
        map.set(newCompany.id, newCompany);
        return Array.from(map.values()).sort((a, b) => a.id - b.id);
      });
      setSelectedCompanyId(newCompany.id);
      setCompanyQuery(newCompany.name);
      setCompanyModalOpen(false);
      setNewCompanyName("");
      setNewCompanyUrl("");
      setNewCompanyLinkedin("");
      setCompanyError(null);
      requestAnimationFrame(() => {
        companyInputRef.current?.focus();
      });
    } catch (err) {
      setCompanyError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setIsSavingCompany(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    if (!trimmedFirstName || !trimmedLastName) {
      setError("First and last name are required.");
      return;
    }

    const normalizedCompany = companyQuery.trim();
    let companyId = selectedCompanyId;
    if (!companyId && normalizedCompany) {
      const match = companies.find(
        (entry) => entry.name.toLowerCase() === normalizedCompany.toLowerCase()
      );
      companyId = match?.id ?? null;
    }
    if (!companyId) {
      setError("Select or create a company.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/people/${personId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: trimmedFirstName,
          lastName: trimmedLastName,
          companyId,
          title: title.trim() || null,
          email: email.trim() || null,
          linkedin: linkedin.trim() || null,
          phone: phone.trim() || null,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to update person.");
      }

      setIsOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <button type="button" onClick={openModal} className={triggerClassName}>
        {triggerLabel}
      </button>

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
                Edit person
              </h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-sm text-[color:var(--muted)] transition-colors hover:text-[color:var(--foreground)]"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[color:var(--foreground)]">
                    First name
                  </label>
                  <input
                    ref={firstNameInputRef}
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    placeholder="Jordan"
                    className="w-full appearance-none rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)] shadow-none outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[color:var(--foreground)]">
                    Last name
                  </label>
                  <input
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    placeholder="Lee"
                    className="w-full appearance-none rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)] shadow-none outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[color:var(--foreground)]">
                  Company
                </label>
                <FastInput
                  items={companyItems}
                  value={selectedCompanyId}
                  query={companyQuery}
                  onQueryChange={setCompanyQuery}
                  onValueChange={setSelectedCompanyId}
                  onCreate={(nameValue) => openCompanyModal(nameValue)}
                  placeholder="Start typing to search or create"
                  listLimit={15}
                  inputRef={companyInputRef}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[color:var(--foreground)]">
                    Title
                  </label>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Hiring Manager"
                    className="w-full appearance-none rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)] shadow-none outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[color:var(--foreground)]">
                    Email
                  </label>
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@company.com"
                    className="w-full appearance-none rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)] shadow-none outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[color:var(--foreground)]">
                    LinkedIn
                  </label>
                  <input
                    value={linkedin}
                    onChange={(event) => setLinkedin(event.target.value)}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full appearance-none rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)] shadow-none outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[color:var(--foreground)]">
                    Phone
                  </label>
                  <input
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="(555) 555-5555"
                    className="w-full appearance-none rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)] shadow-none outline-none"
                  />
                </div>
              </div>

              {error ? (
                <p className="text-sm text-rose-300 dark:text-rose-200">
                  {error}
                </p>
              ) : null}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-[color:var(--accent)]/85 disabled:opacity-60"
                >
                  {isSubmitting ? "Saving..." : "Save person"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg border border-[color:var(--border)] px-4 py-2 text-sm text-[color:var(--muted)] transition-colors hover:border-[color:var(--accent)] hover:text-[color:var(--foreground)] hover:bg-[color:var(--accent)]/10"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {companyModalOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-10">
          <button
            type="button"
            aria-label="Close company modal"
            className="absolute inset-0 z-0 bg-black/60"
            onClick={() => setCompanyModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-2xl ring-1 ring-[color:var(--accent)]/40">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold text-[color:var(--foreground)]">
                Create company
              </h3>
              <button
                type="button"
                onClick={() => setCompanyModalOpen(false)}
                className="text-sm text-[color:var(--muted)]"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateCompany} className="mt-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[color:var(--foreground)]">
                  Name
                </label>
                <input
                  value={newCompanyName}
                  onChange={(event) => setNewCompanyName(event.target.value)}
                  autoFocus
                  placeholder="Acme Corp"
                  className="w-full appearance-none rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)] shadow-none outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[color:var(--foreground)]">
                  Website
                </label>
                <input
                  value={newCompanyUrl}
                  onChange={(event) => setNewCompanyUrl(event.target.value)}
                  placeholder="https://example.com"
                  className="w-full appearance-none rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)] shadow-none outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[color:var(--foreground)]">
                  LinkedIn
                </label>
                <input
                  value={newCompanyLinkedin}
                  onChange={(event) => setNewCompanyLinkedin(event.target.value)}
                  placeholder="https://linkedin.com/company/..."
                  className="w-full appearance-none rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)] shadow-none outline-none"
                />
              </div>

              {companyError ? (
                <p className="text-sm text-rose-300 dark:text-rose-200">
                  {companyError}
                </p>
              ) : null}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSavingCompany}
                  className="rounded-lg bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-[color:var(--accent)]/85 disabled:opacity-60"
                >
                  {isSavingCompany ? "Saving..." : "Save company"}
                </button>
                <button
                  type="button"
                  onClick={() => setCompanyModalOpen(false)}
                  className="rounded-lg border border-[color:var(--border)] px-4 py-2 text-sm text-[color:var(--muted)] transition-colors hover:border-[color:var(--accent)] hover:text-[color:var(--foreground)] hover:bg-[color:var(--accent)]/10"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
