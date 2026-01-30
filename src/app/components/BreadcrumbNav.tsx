import Link from "next/link";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbNavProps = {
  items: BreadcrumbItem[];
  className?: string;
};

export default function BreadcrumbNav({
  items,
  className = "inline-flex items-center text-xs uppercase tracking-wide text-[color:var(--muted)]",
}: BreadcrumbNavProps) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const key = `${item.label}-${index}`;
        const content = item.href && !isLast ? (
          <Link href={item.href} className="hover:text-[#5af5cc]">
            {item.label}
          </Link>
        ) : (
          <span className={isLast ? "text-[color:var(--foreground)]" : undefined}>
            {item.label}
          </span>
        );

        return (
          <span key={key} className="inline-flex items-center">
            {content}
            {!isLast ? (
              <span className="mx-2 text-sm text-[color:var(--border)]">›</span>
            ) : null}
          </span>
        );
      })}
    </nav>
  );
}
