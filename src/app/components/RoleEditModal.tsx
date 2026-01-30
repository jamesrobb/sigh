"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import FastInput, { FastInputItem } from "@/app/components/FastInput";

type CompanyOption = {
  id: number;
  name: string;
};

type CurrencyOption = {
  id: number;
  code: string;
};

type RoleEditModalProps = {
  roleId: number;
  initialTitle: string;
  initialCompanyId: number;
  initialCompanyName: string;
  initialDescription: string | null;
  initialSalaryLowerEnd: number | null;
  initialSalaryHigherEnd: number | null;
  initialCurrencyId: number | null;
  initialCurrencyCode: string | null;
  companies: CompanyOption[];
  triggerLabel?: string;
  triggerClassName?: string;
};

export default function RoleEditModal({
  roleId,
  initialTitle,
  initialCompanyId,
  initialCompanyName,
  initialDescription,
  initialSalaryLowerEnd,
  initialSalaryHigherEnd,
  initialCurrencyId,
  initialCurrencyCode,
  companies: initialCompanies,
  triggerLabel = "Edit role",
  triggerClassName = "rounded-lg border border-[color:var(--border)] px-3 py-1 text-xs text-[color:var(--muted)] transition-colors hover:border-[color:var(--accent)] hover:text-[color:var(--foreground)]",
}: RoleEditModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [companies, setCompanies] = useState<CompanyOption[]>(initialCompanies);
  const [currencies, setCurrencies] = useState<CurrencyOption[]>([]);
  const [companyQuery, setCompanyQuery] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const companyInputRef = useRef<HTMLInputElement | null>(null);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [salaryLowerEnd, setSalaryLowerEnd] = useState(
    initialSalaryLowerEnd !== null ? String(initialSalaryLowerEnd) : ""
  );
  const [salaryHigherEnd, setSalaryHigherEnd] = useState(
    initialSalaryHigherEnd !== null ? String(initialSalaryHigherEnd) : ""
  );
  const [currencyQuery, setCurrencyQuery] = useState("");
  const [selectedCurrencyId, setSelectedCurrencyId] = useState<number | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyUrl, setNewCompanyUrl] = useState("");
  const [newCompanyLinkedin, setNewCompanyLinkedin] = useState("");
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [isSavingCompany, setIsSavingCompany] = useState(false);

  const currencyItems = useMemo<FastInputItem[]>(
    () =>
      currencies.map((entry) => ({
        id: entry.id,
        label: entry.code,
      })),
    [currencies]
  );

  const companyItems = useMemo<FastInputItem[]>(
    () =>
      companies.map((entry) => ({
        id: entry.id,
        label: entry.name,
      })),
    [companies]
  );

  function hydrateCurrencies() {
    let active = true;
    fetch("/api/currencies")
      .then((response) => response.json())
      .then((data) => {
        if (!active || !Array.isArray(data?.currencies)) {
          return;
        }
        const nextCurrencies = (
          data.currencies as Array<{ id: number; code: string }>
        )
          .map((entry) => ({
            id: Number(entry.id),
            code: String(entry.code),
          }))
          .filter(
            (entry: { id: number; code: string }) =>
              Number.isInteger(entry.id) && entry.code
          )
          .sort((a, b) => a.code.localeCompare(b.code));
        setCurrencies(nextCurrencies);
      })
      .catch(() => null);

    return () => {
      active = false;
    };
  }

  function openModal() {
    const selectedCompany =
      companies.find((entry) => entry.id === initialCompanyId) ??
      ({ id: initialCompanyId, name: initialCompanyName } as CompanyOption);
    if (!companies.some((entry) => entry.id === selectedCompany.id)) {
      setCompanies((prev) => [...prev, selectedCompany].sort((a, b) => a.id - b.id));
    }
    setTitle(initialTitle);
    setDescription(initialDescription ?? "");
    setSalaryLowerEnd(
      initialSalaryLowerEnd !== null ? String(initialSalaryLowerEnd) : ""
    );
    setSalaryHigherEnd(
      initialSalaryHigherEnd !== null ? String(initialSalaryHigherEnd) : ""
    );
    const normalizedCurrencyId =
      typeof initialCurrencyId === "number" && initialCurrencyId > 0
        ? initialCurrencyId
        : null;
    const resolvedCurrencyById = normalizedCurrencyId
      ? currencies.find((entry) => entry.id === normalizedCurrencyId) ?? null
      : null;
    const resolvedCurrencyByCode = initialCurrencyCode
      ? currencies.find(
          (entry) => entry.code.toUpperCase() === initialCurrencyCode.toUpperCase()
        ) ?? null
      : null;
    const resolvedCurrency = resolvedCurrencyById ?? resolvedCurrencyByCode;
    if (resolvedCurrency && !currencies.some((entry) => entry.id === resolvedCurrency.id)) {
      setCurrencies((prev) =>
        [...prev, resolvedCurrency].sort((a, b) => a.code.localeCompare(b.code))
      );
    }
    setSelectedCurrencyId(resolvedCurrency?.id ?? normalizedCurrencyId ?? null);
    setCurrencyQuery(resolvedCurrency?.code ?? initialCurrencyCode ?? "");
    setSelectedCompanyId(selectedCompany.id);
    setCompanyQuery(selectedCompany.name);
    setError(null);
    setIsOpen(true);
    hydrateCurrencies();
  }

  function openCompanyModal(name?: string) {
    setCompanyModalOpen(true);
    setNewCompanyName(name ?? "");
    setNewCompanyUrl("");
    setNewCompanyLinkedin("");
    setCompanyError(null);
  }

  async function handleCreateCompany(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setCompanyError(null);

    const name = newCompanyName.trim();
    if (!name) {
      setCompanyError("Company name is required.");
      return;
    }

    setIsSavingCompany(true);
    try {
      const response = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
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

  async function handleCreateCurrency(rawCode: string) {
    const trimmed = rawCode.trim();
    if (!trimmed) {
      return;
    }
    try {
      const response = await fetch("/api/currencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        return;
      }
      const newCurrency: CurrencyOption = {
        id: Number(data.id),
        code: String(data.code),
      };
      setCurrencies((prev) => {
        const map = new Map<number, CurrencyOption>();
        for (const entry of prev) {
          map.set(entry.id, entry);
        }
        map.set(newCurrency.id, newCurrency);
        return Array.from(map.values()).sort((a, b) =>
          a.code.localeCompare(b.code)
        );
      });
      setSelectedCurrencyId(newCurrency.id);
      setCurrencyQuery(newCurrency.code);
    } catch {
      // ignore
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Role title is required.");
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

    type SalaryResult =
      | { ok: true; value: number | null }
      | { ok: false; error: string };
    const parseSalary = (raw: string, label: string): SalaryResult => {
      if (!raw.trim()) {
        return { ok: true, value: null };
      }
      const parsed = Number(raw);
      if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
        return { ok: false, error: `${label} must be a whole number.` };
      }
      return { ok: true, value: parsed };
    };

    const lowerResult = parseSalary(salaryLowerEnd, "Salary lower end");
    if (!lowerResult.ok) {
      setError(lowerResult.error);
      return;
    }
    const higherResult = parseSalary(salaryHigherEnd, "Salary higher end");
    if (!higherResult.ok) {
      setError(higherResult.error);
      return;
    }
    const lowerValue = lowerResult.value;
    const higherValue = higherResult.value;
    if (
      lowerValue !== null &&
      higherValue !== null &&
      lowerValue > higherValue
    ) {
      setError("Salary lower end must be less than or equal to the higher end.");
      return;
    }

    const normalizedCurrency = currencyQuery.trim().toUpperCase();
    const matchedCurrency = normalizedCurrency
      ? currencies.find((entry) => entry.code === normalizedCurrency)
      : null;
    const resolvedCurrencyId =
      selectedCurrencyId ?? matchedCurrency?.id ?? null;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/roles/${roleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          companyId,
          salaryLowerEnd: lowerValue,
          salaryHigherEnd: higherValue,
          currencyId: resolvedCurrencyId,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to update role.");
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
                Edit role
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
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[color:var(--foreground)]">
                  Title
                </label>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Senior Frontend Engineer"
                  className="w-full appearance-none rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)] shadow-none outline-none"
                />
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
                  onCreate={(name) => openCompanyModal(name)}
                  placeholder="Start typing to search or create"
                  listLimit={15}
                  inputRef={companyInputRef}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[color:var(--foreground)]">
                    Salary lower end
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={salaryLowerEnd}
                    onChange={(event) => setSalaryLowerEnd(event.target.value)}
                    placeholder="60000"
                    className="w-full appearance-none rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)] shadow-none outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[color:var(--foreground)]">
                    Salary higher end
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={salaryHigherEnd}
                    onChange={(event) => setSalaryHigherEnd(event.target.value)}
                    placeholder="90000"
                    className="w-full appearance-none rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)] shadow-none outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[color:var(--foreground)]">
                  Salary currency
                </label>
                <FastInput
                  items={currencyItems}
                  value={selectedCurrencyId}
                  query={currencyQuery}
                  onQueryChange={setCurrencyQuery}
                  onValueChange={setSelectedCurrencyId}
                  onCreate={(code) => handleCreateCurrency(code)}
                  placeholder="Start typing to search or create"
                  listLimit={15}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[color:var(--foreground)]">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={4}
                  placeholder="Key responsibilities, tech stack, or notes."
                  className="w-full resize-y rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)] shadow-none outline-none"
                />
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
                  {isSubmitting ? "Saving..." : "Save role"}
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
