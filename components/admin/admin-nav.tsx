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
    { label: "MCQs", href: "/admin/mcqs", soon: true },
    { label: "Tests", href: "/admin/tests", soon: true },
    { label: "Lectures", href: "/admin/lectures", soon: true },
    { label: "Plans", href: "/admin/plans", soon: true },
    { label: "Students", href: "/admin/students", soon: true },
    { label: "Analytics", href: "/admin/analytics", soon: true },
  ];

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active = pathname === item.href;
        if (item.soon) {
          return (
            <span
              key={item.href}
              className="flex cursor-not-allowed items-center justify-between rounded-md px-3 py-2 text-sm text-muted-foreground/50"
            >
              {item.label}
              <span className="text-[10px] uppercase">soon</span>
            </span>
          );
        }
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent",
            )}
          >
            {item.label}
            {item.badge ? (
              <span
                className={cn(
                  "rounded-full px-2 text-xs font-semibold",
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
