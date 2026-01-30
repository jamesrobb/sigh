import Link from "next/link";
import LatestHuntLink from "@/app/components/LatestHuntLink";

type GlobalNavLinksProps = {
  className?: string;
};

export default function GlobalNavLinks({
  className = "flex items-center gap-4 text-xs uppercase tracking-wide text-[color:var(--muted)]",
}: GlobalNavLinksProps) {
  return (
    <div className={className}>
      <LatestHuntLink />
      <Link href="/" className="hover:text-[#5af5cc]">
        Hunts
      </Link>
      <Link href="/people" className="hover:text-[#5af5cc]">
        People
      </Link>
      <Link href="/companies" className="hover:text-[#5af5cc]">
        Companies
      </Link>
    </div>
  );
}
