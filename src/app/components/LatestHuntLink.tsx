import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { hunt } from "@/db/schema";

type LatestHuntLinkProps = {
  className?: string;
  fallbackClassName?: string;
};

export default function LatestHuntLink({
  className = "hover:text-[#5af5cc]",
  fallbackClassName = "text-[color:var(--muted)]",
}: LatestHuntLinkProps) {
  const latest = db
    .select({ id: hunt.id })
    .from(hunt)
    .orderBy(desc(hunt.startDate), desc(hunt.id))
    .limit(1)
    .get();

  if (!latest) {
    return <span className={fallbackClassName}>Latest Hunt</span>;
  }

  return (
    <Link href={`/hunts/${latest.id}`} className={className}>
      Latest Hunt
    </Link>
  );
}
