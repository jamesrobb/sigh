export function formatPersonName(
  firstName: string | null | undefined,
  lastName: string | null | undefined
) {
  const first = (firstName ?? "").trim();
  const last = (lastName ?? "").trim();
  if (!first && !last) {
    return "";
  }
  return [first, last].filter(Boolean).join(" ");
}
