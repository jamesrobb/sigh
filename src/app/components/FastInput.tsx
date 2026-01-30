"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Ref } from "react";

export type FastInputItem = {
  id: number;
  label: string;
};

type FastInputProps = {
  items: FastInputItem[];
  value: number | null;
  query: string;
  onQueryChange: (value: string) => void;
  onValueChange: (value: number | null) => void;
  onCreate?: (name: string) => void;
  placeholder?: string;
  listLimit?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  inputRef?: Ref<HTMLInputElement>;
};

export default function FastInput({
  items,
  value,
  query,
  onQueryChange,
  onValueChange,
  onCreate,
  placeholder,
  listLimit = 15,
  disabled = false,
  autoFocus = false,
  inputRef,
}: FastInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const localInputRef = useRef<HTMLInputElement | null>(null);

  function handleInputRef(element: HTMLInputElement | null) {
    localInputRef.current = element;
    if (!inputRef) {
      return;
    }
    if (typeof inputRef === "function") {
      inputRef(element);
    } else {
      inputRef.current = element;
    }
  }

  const normalizedQuery = query.trim().toLowerCase();
  const filteredItems = useMemo(() => {
    if (!normalizedQuery) {
      return items;
    }
    return items.filter((item) =>
      item.label.toLowerCase().includes(normalizedQuery)
    );
  }, [items, normalizedQuery]);

  const hasExactMatch = useMemo(
    () =>
      items.some(
        (item) => item.label.trim().toLowerCase() === normalizedQuery
      ),
    [items, normalizedQuery]
  );

  const visibleItems = useMemo(() => {
    if (filteredItems.length <= listLimit) {
      return filteredItems;
    }
    return filteredItems.slice(0, listLimit);
  }, [filteredItems, listLimit]);

  const canCreate = Boolean(onCreate && normalizedQuery && !hasExactMatch);
  const totalOptions = visibleItems.length + (canCreate ? 1 : 0);

  useEffect(() => {
    if (!isOpen) {
      setHighlightIndex(-1);
      return;
    }

    if (totalOptions === 0) {
      setHighlightIndex(-1);
      return;
    }

    setHighlightIndex((current) => {
      if (current < 0 || current >= totalOptions) {
        return 0;
      }
      return current;
    });
  }, [isOpen, totalOptions]);

  useEffect(() => {
    if (!isOpen || highlightIndex < 0) {
      return;
    }
    const container = scrollRef.current;
    if (!container) {
      return;
    }
    const el = container.querySelector<HTMLElement>(
      `[data-fast-index="${highlightIndex}"]`
    );
    if (el) {
      el.scrollIntoView({ block: "nearest" });
    }
  }, [highlightIndex, isOpen, totalOptions]);

  function handleSelect(item: FastInputItem) {
    onQueryChange(item.label);
    onValueChange(item.id);
    setIsOpen(false);
  }

  function handleCreate() {
    if (!onCreate) {
      return;
    }
    const name = query.trim();
    if (!name) {
      return;
    }
    onCreate(name);
    setIsOpen(false);
    setHighlightIndex(-1);
  }

  return (
    <div className="relative">
      <input
        ref={handleInputRef}
        value={query}
        disabled={disabled}
        autoFocus={autoFocus}
        onClick={() => {
          if (!disabled) {
            setIsOpen(true);
          }
        }}
        onChange={(event) => {
          onQueryChange(event.target.value);
          onValueChange(null);
          setIsOpen(true);
        }}
        onFocus={() => {
          if (!disabled) {
            setIsOpen(true);
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Tab") {
            setIsOpen(false);
            setHighlightIndex(-1);
            return;
          }

          if (!isOpen) {
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              setIsOpen(true);
            }
            return;
          }

          if (event.key === "Escape") {
            setIsOpen(false);
            setHighlightIndex(-1);
            return;
          }

          if (event.key === "ArrowDown") {
            event.preventDefault();
            if (totalOptions === 0) {
              return;
            }
            setHighlightIndex((current) => {
              const next = current < 0 ? 0 : current + 1;
              return next >= totalOptions ? 0 : next;
            });
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            if (totalOptions === 0) {
              return;
            }
            setHighlightIndex((current) => {
              if (current <= 0) {
                return totalOptions - 1;
              }
              return current - 1;
            });
          } else if (event.key === "Enter") {
            if (highlightIndex >= 0) {
              event.preventDefault();
              if (canCreate && highlightIndex === visibleItems.length) {
                handleCreate();
                return;
              }
              if (visibleItems[highlightIndex]) {
                handleSelect(visibleItems[highlightIndex]);
              }
            } else if (canCreate) {
              event.preventDefault();
              handleCreate();
            }
          }
        }}
        onBlur={() => {
          setTimeout(() => setIsOpen(false), 120);
        }}
        placeholder={placeholder}
        className="w-full appearance-none rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)] shadow-none outline-none"
        aria-expanded={isOpen}
        aria-autocomplete="list"
      />

      {isOpen ? (
        <div
          onMouseDown={(event) => event.preventDefault()}
          className="absolute z-10 mt-2 w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-2 text-sm"
          role="listbox"
        >
          <div ref={scrollRef} className="max-h-48 overflow-y-auto">
            {filteredItems.length === 0 ? (
              <div className="rounded-md border border-[color:var(--border)] bg-black/10 px-3 py-2 text-[color:var(--muted)] dark:bg-white/5">
                <p className="text-sm font-semibold text-[color:var(--foreground)]">
                  No matches.
                </p>
                {canCreate ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span>
                      Create &quot;{query.trim()}&quot; by pressing Enter (with
                      this option selected) or click
                    </span>
                    <button
                      type="button"
                      tabIndex={-1}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        handleCreate();
                      }}
                      className="rounded-md border border-[color:var(--accent)] px-2 py-1 text-xs font-semibold text-[color:var(--foreground)] transition-colors hover:bg-[color:var(--accent)] hover:text-slate-900"
                    >
                      Create
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <>
                {visibleItems.map((item, index) => (
                  <div
                    key={item.id}
                    role="option"
                    aria-selected={value === item.id}
                    data-fast-index={index}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      handleSelect(item);
                    }}
                    className={`flex cursor-pointer items-center justify-between rounded-md px-2 py-1 text-left text-[color:var(--foreground)] hover:bg-black/10 dark:hover:bg-white/10 ${
                      index === highlightIndex ? "bg-black/10 dark:bg-white/10" : ""
                    }`}
                  >
                    <span>{item.label}</span>
                    {value === item.id ? (
                      <span className="text-xs text-[color:var(--muted)]">
                        selected
                      </span>
                    ) : null}
                  </div>
                ))}
                {canCreate ? (
                  <div
                    data-fast-index={visibleItems.length}
                    className={`mt-1 rounded-md border border-[color:var(--border)] bg-black/10 px-3 py-2 text-[color:var(--muted)] dark:bg-white/5 ${
                      highlightIndex === visibleItems.length
                        ? "bg-black/10 dark:bg-white/10"
                        : ""
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span>
                        Create &quot;{query.trim()}&quot; by pressing Enter (with
                        this option selected) or click
                      </span>
                      <button
                        type="button"
                        tabIndex={-1}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          handleCreate();
                        }}
                        className="rounded-md border border-[color:var(--accent)] px-2 py-1 text-xs font-semibold text-[color:var(--foreground)] transition-colors hover:bg-[color:var(--accent)] hover:text-slate-900"
                      >
                        Create
                      </button>
                    </div>
                  </div>
                ) : null}
              </>
            )}
            {filteredItems.length > listLimit ? (
              <div className="px-2 py-1 text-xs text-[color:var(--muted)]">
                … type to search for more
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
