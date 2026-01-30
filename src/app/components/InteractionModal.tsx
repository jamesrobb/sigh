"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import FastInput, { FastInputItem } from "@/app/components/FastInput";
import { formatPersonName } from "@/lib/personName";

type InteractionTypeOption = {
  id: number;
  name: string;
};

type PersonOption = {
  id: number;
  firstName: string;
  lastName: string;
  companyId: number;
  companyName: string;
};

type CompanyOption = {
  id: number;
  name: string;
  url: string | null;
  linkedin: string | null;
};

type InteractionSeed = {
  id: number;
  interactionTypeId: number;
  personId: number | null;
  occurredAt: number | string;
  notes: string | null;
};

type InteractionModalProps = {
  roleId: number;
  companyId: number;
  companyName: string;
  interactionTypes: InteractionTypeOption[];
  people: PersonOption[];
  mode?: "create" | "edit";
  initialInteraction?: InteractionSeed;
  lockPersonId?: number | null;
  lockPersonLabel?: string | null;
  hidePersonField?: boolean;
  triggerLabel?: string;
  triggerHint?: string | null;
  enableShortcut?: boolean;
  onSaved?: () => void;
  triggerClassName?: string;
  triggerContainerClassName?: string;
};

export default function InteractionModal({
  roleId,
  companyId,
  companyName,
  interactionTypes,
  people: initialPeople,
  mode = "create",
  initialInteraction,
  lockPersonId,
  lockPersonLabel,
  hidePersonField,
  triggerLabel,
  triggerHint,
  enableShortcut,
  onSaved,
  triggerClassName,
  triggerContainerClassName,
}: InteractionModalProps) {
  const router = useRouter();
  const listLimit = 15;
  const isEditMode = mode === "edit";
  const isPersonLocked =
    lockPersonId !== undefined && lockPersonId !== null;
  const resolvedTriggerLabel =
    triggerLabel ?? (isEditMode ? "Edit" : "Add interaction");
  const resolvedTriggerHint =
    triggerHint !== undefined
      ? triggerHint
      : isEditMode
        ? null
        : "Press 'c' to create to add interaction or click";
  const allowShortcut = enableShortcut ?? !isEditMode;
  const resolvedTriggerContainerClassName =
    triggerContainerClassName ??
    "flex flex-wrap items-center gap-2 text-xs text-[color:var(--muted)]";
  const resolvedTriggerClassName =
    triggerClassName ??
    "rounded-lg border border-[color:var(--border)] px-3 py-1 text-xs text-[color:var(--muted)] transition-colors hover:border-[color:var(--accent)] hover:text-[color:var(--foreground)]";
  const formatPersonLabel = (person: PersonOption) =>
    `${formatPersonName(person.firstName, person.lastName)} (${person.companyName})`;
  const resolveLockedLabel = () => {
    if (lockPersonLabel) {
      return lockPersonLabel;
    }
    const match = people.find((entry) => entry.id === lockPersonId);
    return match ? formatPersonLabel(match) : "";
  };
  const sortPeople = (list: PersonOption[]) =>
    [...list].sort((a, b) => {
      const aMatch = a.companyId === companyId;
      const bMatch = b.companyId === companyId;
      if (aMatch !== bMatch) {
        return aMatch ? -1 : 1;
      }
      const firstCompare = a.firstName.localeCompare(b.firstName);
      if (firstCompare !== 0) {
        return firstCompare;
      }
      const lastCompare = a.lastName.localeCompare(b.lastName);
      if (lastCompare !== 0) {
        return lastCompare;
      }
      return a.id - b.id;
    });

  const [isOpen, setIsOpen] = useState(false);
  const [types, setTypes] = useState<InteractionTypeOption[]>(() =>
    [...interactionTypes].sort((a, b) => a.id - b.id)
  );
  const [people, setPeople] = useState<PersonOption[]>(() =>
    sortPeople(initialPeople)
  );
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [typeQuery, setTypeQuery] = useState("");
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [personQuery, setPersonQuery] = useState("");
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null);
  const [personModalOpen, setPersonModalOpen] = useState(false);
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const personInputRef = useRef<HTMLInputElement | null>(null);
  const [personCompanyQuery, setPersonCompanyQuery] = useState("");
  const [selectedPersonCompanyId, setSelectedPersonCompanyId] = useState<
    number | null
  >(null);
  const [newPersonFirstName, setNewPersonFirstName] = useState("");
  const [newPersonLastName, setNewPersonLastName] = useState("");
  const [newPersonTitle, setNewPersonTitle] = useState("");
  const [newPersonEmail, setNewPersonEmail] = useState("");
  const [newPersonLinkedin, setNewPersonLinkedin] = useState("");
  const [newPersonPhone, setNewPersonPhone] = useState("");
  const personCompanyInputRef = useRef<HTMLInputElement | null>(null);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyUrl, setNewCompanyUrl] = useState("");
  const [newCompanyLinkedin, setNewCompanyLinkedin] = useState("");
  const [personError, setPersonError] = useState<string | null>(null);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [isSavingPerson, setIsSavingPerson] = useState(false);
  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const [occurredDate, setOccurredDate] = useState("");
  const [occurredTime, setOccurredTime] = useState("");
  const [selectedTimeId, setSelectedTimeId] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (companyModalOpen) {
          setCompanyModalOpen(false);
        } else if (personModalOpen) {
          setPersonModalOpen(false);
        } else {
          setIsOpen(false);
        }
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [companyModalOpen, isOpen, personModalOpen]);

  useEffect(() => {
    if (!allowShortcut) {
      return;
    }

    function handleShortcut(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "c") {
        return;
      }
      if (isOpen || personModalOpen || companyModalOpen) {
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
      openModal();
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [allowShortcut, companyModalOpen, isOpen, openModal, personModalOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    if (isEditMode && initialInteraction) {
      return;
    }
    const parts = getNowParts();
    setOccurredDate(parts.date);
    setOccurredTime(parts.time);
    setSelectedTimeId(getTimeId(parts.time));
  }, [initialInteraction, isEditMode, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let active = true;
    fetch("/api/interaction-types")
      .then((response) => response.json())
      .then((data) => {
        if (!active || !Array.isArray(data?.types)) {
          return;
        }
        const nextTypes = (data.types as Array<{ id: number; name: string }>)
          .map((type: { id: number; name: string }) => ({
            id: Number(type.id),
            name: String(type.name),
          }))
          .filter(
            (type: { id: number; name: string }) =>
              Number.isInteger(type.id) && type.name
          )
          .sort((a, b) => a.id - b.id);
        if (nextTypes.length > 0) {
          setTypes((prev) => {
            const map = new Map<number, InteractionTypeOption>();
            for (const item of prev) {
              map.set(item.id, item);
            }
            for (const item of nextTypes) {
              map.set(item.id, item);
            }
            return Array.from(map.values()).sort((a, b) => a.id - b.id);
          });
        }
      })
      .catch(() => null);

    fetch("/api/companies")
      .then((response) => response.json())
      .then((data) => {
        if (!active || !Array.isArray(data?.companies)) {
          return;
        }
        const nextCompanies = (
          data.companies as Array<{
            id: number;
            name: string;
            url?: string | null;
            linkedin?: string | null;
          }>
        )
          .map((entry) => ({
            id: Number(entry.id),
            name: String(entry.name),
            url: entry.url ?? null,
            linkedin: entry.linkedin ?? null,
          }))
          .filter(
            (entry: { id: number; name: string }) =>
              Number.isInteger(entry.id) && entry.name
          )
          .sort((a, b) => a.id - b.id);
        if (!nextCompanies.some((entry) => entry.id === companyId)) {
          nextCompanies.push({
            id: companyId,
            name: companyName,
            url: null,
            linkedin: null,
          });
          nextCompanies.sort((a, b) => a.id - b.id);
        }
        setCompanies(nextCompanies);
      })
      .catch(() => null);

    return () => {
      active = false;
    };
  }, [companyId, companyName, isOpen]);

  const typeItems = useMemo<FastInputItem[]>(
    () =>
      types.map((type) => ({
        id: type.id,
        label: type.name,
      })),
    [types]
  );

  const personItems = useMemo<FastInputItem[]>(
    () =>
      people.map((person) => ({
        id: person.id,
        label: formatPersonLabel(person),
      })),
    [people]
  );

  const companyItems = useMemo<FastInputItem[]>(
    () =>
      companies.map((entry) => ({
        id: entry.id,
        label: entry.name,
      })),
    [companies]
  );

  function getNowParts() {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const local = new Date(now.getTime() - offset).toISOString();
    return {
      date: local.slice(0, 10),
      time: local.slice(11, 16),
    };
  }

  function formatDateTimeParts(value: number | string) {
    const date = typeof value === "number" ? new Date(value) : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return getNowParts();
    }
    const offset = date.getTimezoneOffset() * 60000;
    const local = new Date(date.getTime() - offset).toISOString();
    return {
      date: local.slice(0, 10),
      time: local.slice(11, 16),
    };
  }

  function getTimeId(value: string) {
    const [hours, minutes] = value.split(":").map((part) => Number(part));
    if (
      !Number.isInteger(hours) ||
      !Number.isInteger(minutes) ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      return null;
    }
    return hours * 60 + minutes;
  }

  function splitName(value: string) {
    const parts = value.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return { firstName: "", lastName: "" };
    }
    if (parts.length === 1) {
      return { firstName: parts[0], lastName: "" };
    }
    return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
  }

  const timeItems = useMemo<FastInputItem[]>(() => {
    const entries: FastInputItem[] = [];
    for (let hour = 0; hour < 24; hour += 1) {
      for (let minute = 0; minute < 60; minute += 15) {
        const label = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
        entries.push({ id: hour * 60 + minute, label });
      }
    }
    return entries;
  }, []);

  function applyInitialValues(seed: InteractionSeed) {
    const typeMatch = types.find((type) => type.id === seed.interactionTypeId);
    const personMatch = people.find((person) => person.id === seed.personId);
    setSelectedTypeId(seed.interactionTypeId);
    setTypeQuery(typeMatch?.name ?? "");
    if (isPersonLocked) {
      const lockedLabel = resolveLockedLabel();
      setSelectedPersonId(lockPersonId ?? null);
      setPersonQuery(lockedLabel ?? "");
    } else {
      setSelectedPersonId(seed.personId);
      setPersonQuery(personMatch ? formatPersonLabel(personMatch) : "");
    }
    const parts = formatDateTimeParts(seed.occurredAt);
    setOccurredDate(parts.date);
    setOccurredTime(parts.time);
    setSelectedTimeId(getTimeId(parts.time));
    setNotes(seed.notes ?? "");
    setError(null);
  }

  function resetForm() {
    setTypeQuery("");
    setSelectedTypeId(null);
    if (isPersonLocked) {
      const lockedLabel = resolveLockedLabel();
      setSelectedPersonId(lockPersonId ?? null);
      setPersonQuery(lockedLabel);
    } else {
      setPersonQuery("");
      setSelectedPersonId(null);
    }
    setPersonModalOpen(false);
    setPersonCompanyQuery("");
    setSelectedPersonCompanyId(null);
    setNewPersonFirstName("");
    setNewPersonLastName("");
    setNewPersonTitle("");
    setNewPersonEmail("");
    setNewPersonLinkedin("");
    setNewPersonPhone("");
    setPersonError(null);
    const parts = getNowParts();
    setOccurredDate(parts.date);
    setOccurredTime(parts.time);
    setSelectedTimeId(getTimeId(parts.time));
    setNotes("");
    setError(null);
  }

  async function handleCreateType(rawName?: string) {
    setError(null);
    const name = (rawName ?? typeQuery).trim();
    if (!name) {
      setError("Interaction type name is required.");
      return;
    }

    const response = await fetch("/api/interaction-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      setError(data?.error ?? "Failed to create interaction type.");
      return;
    }

    const newType: InteractionTypeOption = {
      id: Number(data.id),
      name: data.name,
    };
    setTypes((prev) => {
      const map = new Map<number, InteractionTypeOption>();
      for (const item of prev) {
        map.set(item.id, item);
      }
      map.set(newType.id, newType);
      return Array.from(map.values()).sort((a, b) => a.id - b.id);
    });
    setSelectedTypeId(newType.id);
    setTypeQuery(newType.name);
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
        url: data.url ?? null,
        linkedin: data.linkedin ?? null,
      };

      setCompanies((prev) => {
        const map = new Map<number, CompanyOption>();
        for (const entry of prev) {
          map.set(entry.id, entry);
        }
        map.set(newCompany.id, newCompany);
        return Array.from(map.values()).sort((a, b) => a.id - b.id);
      });
      setSelectedPersonCompanyId(newCompany.id);
      setPersonCompanyQuery(newCompany.name);
      setCompanyModalOpen(false);
      setNewCompanyName("");
      setNewCompanyUrl("");
      setNewCompanyLinkedin("");
      setCompanyError(null);
      requestAnimationFrame(() => {
        personCompanyInputRef.current?.focus();
      });
    } catch (err) {
      setCompanyError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setIsSavingCompany(false);
    }
  }

  function openPersonModal(name?: string) {
    const defaultCompany =
      companies.find((entry) => entry.id === companyId) ?? {
        id: companyId,
        name: companyName,
        url: null,
        linkedin: null,
      };

    setCompanies((prev) => {
      if (prev.some((entry) => entry.id === defaultCompany.id)) {
        return prev;
      }
      return [...prev, defaultCompany].sort((a, b) => a.id - b.id);
    });

    setPersonModalOpen(true);
    const parsedName = splitName(name ?? "");
    setNewPersonFirstName(parsedName.firstName);
    setNewPersonLastName(parsedName.lastName);
    setNewPersonTitle("");
    setNewPersonEmail("");
    setNewPersonLinkedin("");
    setNewPersonPhone("");
    setPersonError(null);
    setSelectedPersonCompanyId(defaultCompany.id);
    setPersonCompanyQuery(defaultCompany.name);
  }

  function openModal() {
    setError(null);
    if (isEditMode && initialInteraction) {
      applyInitialValues(initialInteraction);
    } else {
      const parts = getNowParts();
      setOccurredDate(parts.date);
      setOccurredTime(parts.time);
      setSelectedTimeId(getTimeId(parts.time));
      setNotes("");
      setSelectedTypeId(null);
      setTypeQuery("");
      if (isPersonLocked) {
        setSelectedPersonId(lockPersonId ?? null);
        setPersonQuery(resolveLockedLabel());
      } else {
        setSelectedPersonId(null);
        setPersonQuery("");
      }
    }
    setIsOpen(true);
  }

  async function handleCreatePerson(
    event?: React.FormEvent<HTMLFormElement>
  ) {
    event?.preventDefault();
    setPersonError(null);
    const firstName = newPersonFirstName.trim();
    const lastName = newPersonLastName.trim();
    if (!firstName || !lastName) {
      setPersonError("First and last name are required.");
      return;
    }

    const queryCompany = personCompanyQuery.trim().toLowerCase();
    const matchedCompany = queryCompany
      ? companies.find((entry) => entry.name.toLowerCase() === queryCompany)
      : null;
    const resolvedCompanyId =
      selectedPersonCompanyId ?? matchedCompany?.id ?? null;
    if (!resolvedCompanyId) {
      setPersonError("Select a company.");
      return;
    }

    setIsSavingPerson(true);
    try {
      const response = await fetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: resolvedCompanyId,
          firstName,
          lastName,
          title: newPersonTitle.trim() || null,
          email: newPersonEmail.trim() || null,
          linkedin: newPersonLinkedin.trim() || null,
          phone: newPersonPhone.trim() || null,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to create person.");
      }

      const resolvedCompany =
        companies.find((entry) => entry.id === resolvedCompanyId) ??
        (resolvedCompanyId === companyId
          ? { id: companyId, name: companyName, url: null }
          : null);

      const newPerson: PersonOption = {
        id: Number(data.id),
        firstName: data.firstName,
        lastName: data.lastName,
        companyId: resolvedCompanyId,
        companyName: resolvedCompany?.name ?? companyName,
      };

      setPeople((prev) => sortPeople([...prev, newPerson]));
      setSelectedPersonId(newPerson.id);
      setPersonQuery(formatPersonLabel(newPerson));
      setPersonModalOpen(false);
      setNewPersonFirstName("");
      setNewPersonLastName("");
      setNewPersonTitle("");
      setNewPersonEmail("");
      setNewPersonLinkedin("");
      setNewPersonPhone("");
      setPersonError(null);
      requestAnimationFrame(() => {
        personInputRef.current?.focus();
      });
    } catch (err) {
      setPersonError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setIsSavingPerson(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    let personId = isPersonLocked ? lockPersonId ?? null : selectedPersonId;
    if (!isPersonLocked) {
      const normalizedPersonQuery = personQuery.trim().toLowerCase();
      if (normalizedPersonQuery) {
        if (!personId) {
          const match = people.find(
            (person) =>
              formatPersonLabel(person).toLowerCase() === normalizedPersonQuery
          );
          personId = match?.id ?? null;
        }

        if (!personId) {
          setError("Select a person or clear the field.");
          return;
        }
      } else {
        personId = null;
      }
    }

    const normalizedTypeQuery = typeQuery.trim().toLowerCase();
    let interactionTypeId = selectedTypeId;
    if (!interactionTypeId && normalizedTypeQuery) {
      const match = types.find(
        (type) => type.name.toLowerCase() === normalizedTypeQuery
      );
      interactionTypeId = match?.id ?? null;
    }

    if (!interactionTypeId) {
      setError("Select an interaction type.");
      return;
    }

    setIsSubmitting(true);
    try {
      const editingInteraction = isEditMode ? initialInteraction : undefined;
      const interactionId = editingInteraction?.id;
      const isEditing = Boolean(interactionId);
      const endpoint = isEditing
        ? `/api/interactions/${interactionId}`
        : "/api/interactions";
      const method = isEditing ? "PATCH" : "POST";
      const occurredAt =
        occurredDate && occurredTime
          ? `${occurredDate}T${occurredTime}`
          : occurredDate || new Date().toISOString();
      const payload = isEditing
        ? {
            interactionTypeId,
            personId: personId ?? null,
            occurredAt,
            notes: notes.trim() || null,
          }
        : {
            roleId,
            interactionTypeId,
            personId: personId ?? null,
            occurredAt,
            notes: notes.trim() || null,
          };

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          data?.error ??
            (isEditing
              ? "Failed to update interaction."
              : "Failed to create interaction.")
        );
      }

      resetForm();
      setIsOpen(false);
      if (onSaved) {
        onSaved();
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const modalTitle = isEditMode ? "Edit interaction" : "Add interaction";

  return (
    <>
      <div className={resolvedTriggerContainerClassName}>
        {resolvedTriggerHint ? <span>{resolvedTriggerHint}</span> : null}
        <button
          type="button"
          onClick={openModal}
          className={resolvedTriggerClassName}
        >
          {resolvedTriggerLabel}
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
                {modalTitle}
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
                  Interaction type
                </label>
                <FastInput
                  items={typeItems}
                  value={selectedTypeId}
                  query={typeQuery}
                  onQueryChange={setTypeQuery}
                  onValueChange={setSelectedTypeId}
                  onCreate={(name) => handleCreateType(name)}
                  placeholder="Start typing to search or create"
                  listLimit={listLimit}
                  autoFocus
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {hidePersonField || isPersonLocked ? (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[color:var(--foreground)]">
                      Contact person
                    </label>
                    <div className="w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--muted)]">
                      {personQuery || "Person locked"}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[color:var(--foreground)]">
                      Contact person
                    </label>
                    <FastInput
                      items={personItems}
                      value={selectedPersonId}
                      query={personQuery}
                      onQueryChange={setPersonQuery}
                      onValueChange={setSelectedPersonId}
                      onCreate={(name) => openPersonModal(name)}
                      placeholder="Start typing to search or create"
                      listLimit={listLimit}
                      inputRef={personInputRef}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[color:var(--foreground)]">
                    Occurred at
                  </label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      type="date"
                      value={occurredDate}
                      onChange={(event) => setOccurredDate(event.target.value)}
                      className="w-full appearance-none rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)] shadow-none outline-none"
                    />
                    <FastInput
                      items={timeItems}
                      value={selectedTimeId}
                      query={occurredTime}
                      onQueryChange={(value) => {
                        setOccurredTime(value);
                        setSelectedTimeId(getTimeId(value));
                      }}
                      onValueChange={setSelectedTimeId}
                      placeholder="HH:MM"
                      listLimit={15}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[color:var(--foreground)]">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  placeholder="Quick summary or follow-ups."
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
                  className="rounded-lg border border-transparent bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:border-[color:var(--foreground)] hover:bg-[color:var(--accent)]/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/40 disabled:opacity-60"
                >
                  {isSubmitting ? "Saving..." : "Save interaction"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg border border-[color:var(--border)] px-4 py-2 text-sm text-[color:var(--muted)] transition-colors hover:border-[color:var(--accent)] hover:text-[color:var(--foreground)] hover:bg-[color:var(--accent)]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/40"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {personModalOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-10">
          <button
            type="button"
            aria-label="Close person modal"
            className="absolute inset-0 z-0 bg-black/60"
            onClick={() => setPersonModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-2xl ring-1 ring-[color:var(--accent)]/40">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold text-[color:var(--foreground)]">
                Create person
              </h3>
              <button
                type="button"
                onClick={() => setPersonModalOpen(false)}
                className="text-sm text-[color:var(--muted)]"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreatePerson} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[color:var(--foreground)]">
                    First name
                  </label>
                  <input
                    value={newPersonFirstName}
                    onChange={(event) => setNewPersonFirstName(event.target.value)}
                    autoFocus
                    placeholder="Jordan"
                    className="w-full appearance-none rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)] shadow-none outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[color:var(--foreground)]">
                    Last name
                  </label>
                  <input
                    value={newPersonLastName}
                    onChange={(event) => setNewPersonLastName(event.target.value)}
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
                  value={selectedPersonCompanyId}
                  query={personCompanyQuery}
                  onQueryChange={setPersonCompanyQuery}
                  onValueChange={setSelectedPersonCompanyId}
                  onCreate={(name) => openCompanyModal(name)}
                  placeholder="Start typing to search or create"
                  listLimit={listLimit}
                  inputRef={personCompanyInputRef}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[color:var(--foreground)]">
                    Title
                  </label>
                  <input
                    value={newPersonTitle}
                    onChange={(event) => setNewPersonTitle(event.target.value)}
                    placeholder="Hiring Manager"
                    className="w-full appearance-none rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)] shadow-none outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[color:var(--foreground)]">
                    Email
                  </label>
                  <input
                    value={newPersonEmail}
                    onChange={(event) => setNewPersonEmail(event.target.value)}
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
                    value={newPersonLinkedin}
                    onChange={(event) => setNewPersonLinkedin(event.target.value)}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full appearance-none rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)] shadow-none outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[color:var(--foreground)]">
                    Phone
                  </label>
                  <input
                    value={newPersonPhone}
                    onChange={(event) => setNewPersonPhone(event.target.value)}
                    placeholder="(555) 555-5555"
                    className="w-full appearance-none rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)] shadow-none outline-none"
                  />
                </div>
              </div>

              {personError ? (
                <p className="text-sm text-rose-300 dark:text-rose-200">
                  {personError}
                </p>
              ) : null}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSavingPerson}
                  className="rounded-lg bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-60"
                >
                  {isSavingPerson ? "Saving..." : "Save person"}
                </button>
                <button
                  type="button"
                  onClick={() => setPersonModalOpen(false)}
                  className="rounded-lg border border-[color:var(--border)] px-4 py-2 text-sm text-[color:var(--muted)]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {companyModalOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4 py-10">
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
