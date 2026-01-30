export type RoleStatus = "Open" | "Accepted" | "Rejected" | "Closed";

export const ROLE_STATUSES: RoleStatus[] = [
  "Open",
  "Accepted",
  "Rejected",
  "Closed",
];

const ROLE_STATUS_BY_INTERACTION = new Map<string, RoleStatus>([
  ["offer declined", "Closed"],
  ["offer accepted", "Accepted"],
  ["ghosted", "Rejected"],
  ["rejected", "Rejected"],
  ["decision to not pursue", "Closed"],
]);

export function getRoleStatusFromInteractionType(
  interactionTypeName: string | null | undefined
): RoleStatus | null {
  if (!interactionTypeName) {
    return null;
  }
  const normalized = interactionTypeName.trim().toLowerCase();
  return ROLE_STATUS_BY_INTERACTION.get(normalized) ?? null;
}

export function deriveRoleStatus(
  interactionTypeNames: Array<string | null | undefined>
): RoleStatus {
  for (const name of interactionTypeNames) {
    const status = getRoleStatusFromInteractionType(name);
    if (status) {
      return status;
    }
  }
  return "Open";
}
