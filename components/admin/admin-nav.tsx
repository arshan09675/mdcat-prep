"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  badge?: number;
  soon?: boolean;
}

export function AdminNav({ pendingPayments }: { pendingPayments: number }) {
  const pathname = usePathname();

  const items: NavItem[] = [
    { label: "Payments", href: "/admin/payments", badge: pendingPayments },
    { label: "MCQs", href: "/admin/mcqs" },
    { label: "Tests", href: "/admin/tests" },
    { label: "Lectures", href: "/admin/lectures" },
    { label: "Books & Notes", href: "/admin/books" },
    { label: "Plans", href: "/admin/plans" },
    { label: "Students", href: "/admin/students" },
    { label: "Analytics", href: "/admin/analytics" },
  ];

  return (
    <nav className="flex flex-row gap-1 overflow-x-auto pb-1 md:flex-col md:overflow-visible md:pb-0">
      {items.map((item) => {
        const active = pathname === item.href;
        if (item.soon) {
          return (
            <span
              key={item.href}
              className="flex shrink-0 cursor-not-allowed items-center justify-between gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm text-muted-foreground/50"
            >
              {item.label}
              <span className="hidden text-[10px] uppercase tracking-wide md:inline">
                soon
              </span>
            </span>
          );
        }
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center justify-between gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            {item.label}
            {item.badge ? (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-semibold",
                  active
                    ? "bg-primary-foreground text-primary"
                    : "bg-primary text-primary-foreground",
                )}
              >
                {item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
