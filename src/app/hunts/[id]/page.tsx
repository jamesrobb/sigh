import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  company,
  hunt,
  huntStatus,
  interactionRole,
  interactionTypeRole,
  roleTag,
  role,
  tag,
} from "@/db/schema";
import HuntRolesPanel from "@/app/components/HuntRolesPanel";
import HuntEditModal from "@/app/components/HuntEditModal";
import HuntDeleteButton from "@/app/components/HuntDeleteButton";
import { ROLE_STATUSES, getRoleStatusFromInteractionType } from "@/lib/roleStatus";
import { getStatusTone } from "@/lib/statusTone";
import GlobalNavLinks from "@/app/components/GlobalNavLinks";
import BreadcrumbNav from "@/app/components/BreadcrumbNav";

export const dynamic = "force-dynamic";

function formatDate(value: number | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type HuntPageProps = {
  params: Promise<{ id: string }>;
};

export default async function HuntPage({ params }: HuntPageProps) {
  const { id } = await params;
  const huntId = Number(id);
  if (!Number.isInteger(huntId)) {
    notFound();
  }

  const huntRow = db
    .select({
      id: hunt.id,
      name: hunt.name,
      startDate: hunt.startDate,
      endDate: hunt.endDate,
      statusId: hunt.huntStatusId,
      statusName: huntStatus.name,
    })
    .from(hunt)
    .innerJoin(huntStatus, eq(hunt.huntStatusId, huntStatus.id))
    .where(eq(hunt.id, huntId))
    .get();

  if (!huntRow) {
    notFound();
  }

  const huntStatuses = db
    .select({ id: huntStatus.id, name: huntStatus.name })
    .from(huntStatus)
    .orderBy(huntStatus.id)
    .all();

  const roles = db
    .select({
      id: role.id,
      title: role.title,
      companyName: company.name,
      createdAt: role.createdAt,
    })
    .from(role)
    .innerJoin(company, eq(role.companyId, company.id))
    .where(eq(role.huntId, huntId))
    .all();

  const allTags = db
    .select({ id: tag.id, name: tag.name })
    .from(tag)
    .orderBy(asc(tag.name))
    .all();

  const roleIds = roles.map((entry) => entry.id);
  const roleTagRows =
    roleIds.length > 0
      ? db
          .select({ roleId: roleTag.roleId, tagId: roleTag.tagId })
          .from(roleTag)
          .where(inArray(roleTag.roleId, roleIds))
          .all()
      : [];

  const tagIdsByRole = new Map<number, number[]>();
  for (const entry of roleTagRows) {
    const id = Number(entry.roleId);
    const tagId = Number(entry.tagId);
    const list = tagIdsByRole.get(id) ?? [];
    list.push(tagId);
    tagIdsByRole.set(id, list);
  }

  const interactionNames = db
    .select({
      id: interactionRole.id,
      roleId: interactionRole.roleId,
      name: interactionTypeRole.name,
      occurredAt: interactionRole.occurredAt,
    })
    .from(interactionRole)
    .innerJoin(role, eq(interactionRole.roleId, role.id))
    .innerJoin(
      interactionTypeRole,
      eq(interactionRole.interactionTypeId, interactionTypeRole.id)
    )
    .where(eq(role.huntId, huntId))
    .orderBy(desc(interactionRole.occurredAt), desc(interactionRole.id))
    .all();

  const interactionTypes = db
    .select({ id: interactionTypeRole.id, name: interactionTypeRole.name })
    .from(interactionTypeRole)
    .orderBy(asc(interactionTypeRole.id))
    .all();

  const lastInteractionByRole = new Map<
    number,
    { id: number; name: string; occurredAt: number }
  >();
  const statusByRoleId = new Map<number, string>();
  for (const entry of interactionNames) {
    if (!lastInteractionByRole.has(entry.roleId)) {
      const occurredAt =
        entry.occurredAt instanceof Date
          ? entry.occurredAt.getTime()
          : Number(entry.occurredAt);
      lastInteractionByRole.set(entry.roleId, {
        id: Number(entry.id),
        name: entry.name,
        occurredAt,
      });
    }
    if (!statusByRoleId.has(entry.roleId)) {
      const status = getRoleStatusFromInteractionType(entry.name);
      if (status) {
        statusByRoleId.set(entry.roleId, status);
      }
    }
  }

  const statusCounts: Record<string, number> = Object.fromEntries(
    ROLE_STATUSES.map((status) => [status, 0])
  );

  for (const roleRow of roles) {
    const status = statusByRoleId.get(roleRow.id) ?? "Open";
    statusCounts[status] = (statusCounts[status] ?? 0) + 1;
  }

  const rolesByRecency = [...roles].sort((a, b) => {
    const aKey =
      lastInteractionByRole.get(a.id)?.occurredAt ??
      (a.createdAt instanceof Date ? a.createdAt.getTime() : Number(a.createdAt));
    const bKey =
      lastInteractionByRole.get(b.id)?.occurredAt ??
      (b.createdAt instanceof Date ? b.createdAt.getTime() : Number(b.createdAt));
    if (aKey === bKey) {
      const aInteractionId = lastInteractionByRole.get(a.id)?.id ?? null;
      const bInteractionId = lastInteractionByRole.get(b.id)?.id ?? null;
      if (
        aInteractionId !== null &&
        bInteractionId !== null &&
        aInteractionId !== bInteractionId
      ) {
        return bInteractionId - aInteractionId;
      }
      return a.title.localeCompare(b.title);
    }
    return bKey - aKey;
  });

  const rolesWithStatus = rolesByRecency.map((entry) => {
    const status = statusByRoleId.get(entry.id) ?? "Open";
    return {
      id: entry.id,
      title: entry.title,
      companyName: entry.companyName,
      createdAt:
        entry.createdAt instanceof Date
          ? entry.createdAt.getTime()
          : Number(entry.createdAt),
      lastInteractionType: lastInteractionByRole.get(entry.id)?.name ?? null,
      lastInteractionAt: lastInteractionByRole.get(entry.id)?.occurredAt ?? null,
      status,
      tagIds: tagIdsByRole.get(entry.id) ?? [],
    };
  });

  const statItems = [
    {
      key: "total",
      label: "Total",
      value: roles.length,
      tooltip: "Total roles tracked in this hunt.",
    },
    ...ROLE_STATUSES.map((status) => ({
      key: status,
      label: status,
      value: statusCounts[status],
      tone: getStatusTone(status),
      tooltip: `Roles whose status is ${status}.`,
    })),
  ];

  return (
    <main className="box-border px-6 pt-12 pb-10">
      <div className="fixed inset-x-0 top-0 z-30">
        <div className="mx-auto w-full max-w-5xl">
          <div className="flex h-12 items-center justify-between rounded-b-lg border border-t-0 border-[color:var(--border)] bg-[color:var(--card)] px-6">
            <BreadcrumbNav
              items={[{ label: "Hunts", href: "/" }, { label: huntRow.name }]}
            />
            <GlobalNavLinks />
          </div>
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 pt-6">

        <header className="space-y-4 px-2">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold text-[color:var(--foreground)]">
                  {huntRow.name}
                </h1>
              </div>
              <p className="text-sm text-[color:var(--muted)]">
                <span className="uppercase tracking-wide text-xs text-[color:var(--muted)]">
                  Status;
                </span>{" "}
                <span className="text-[color:var(--foreground)]">
                  {huntRow.statusName}
                </span>
                <span className="mx-2 text-[color:var(--border)]">·</span>
                <span className="uppercase tracking-wide text-xs text-[color:var(--muted)]">
                  Started;
                </span>{" "}
                <span className="text-[color:var(--foreground)]">
                  {formatDate(huntRow.startDate)}
                </span>
                {huntRow.endDate ? (
                  <>
                    <span className="mx-2 text-[color:var(--border)]">·</span>
                    <span className="uppercase tracking-wide text-xs text-[color:var(--muted)]">
                      Ended;
                    </span>{" "}
                    <span className="text-[color:var(--foreground)]">
                      {formatDate(huntRow.endDate)}
                    </span>
                  </>
                ) : null}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <HuntEditModal
                huntId={huntRow.id}
                initialName={huntRow.name}
                initialStatusId={huntRow.statusId}
                initialStartDate={huntRow.startDate}
                initialEndDate={huntRow.endDate}
                statuses={huntStatuses}
              />
              <HuntDeleteButton huntId={huntRow.id} huntName={huntRow.name} />
            </div>
          </div>
        </header>

        <HuntRolesPanel
          huntId={huntId}
          roles={rolesWithStatus}
          statItems={statItems}
          tags={allTags}
          statusOptions={ROLE_STATUSES}
          interactionTypes={interactionTypes}
        />
      </div>
    </main>
  );
}
