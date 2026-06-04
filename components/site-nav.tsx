"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, Menu, X } from "lucide-react";
import { logout } from "@/app/(auth)/actions";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Subjects", href: "/subjects" },
  { label: "Mock Tests", href: "/tests" },
  { label: "Pricing", href: "/pricing" },
  { label: "Contact", href: "/contact" },
];

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3" aria-label="MDCAT Prep home">
      <span className="logo-box">
        <GraduationCap className="h-5 w-5" />
      </span>
      <span>
        <span className="logo-w1 block font-display">MDCAT</span>
        <span className="logo-w2 block">Preparation</span>
      </span>
    </Link>
  );
}

export function SiteNav({
  signedIn,
  isStaff,
}: {
  signedIn: boolean;
  isStaff: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = [
    ...NAV_LINKS,
    ...(signedIn ? [{ label: "Dashboard", href: "/dashboard" }] : []),
    ...(isStaff ? [{ label: "Admin", href: "/admin" }] : []),
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav className="glass-nav">
      <div className="mx-auto flex h-[68px] max-w-[1100px] items-center justify-between px-5 md:px-8">
        <Logo />

        {/* Desktop links */}
        <ul className="hidden list-none items-center gap-8 md:flex">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`nav-link ${isActive(link.href) ? "active" : ""}`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2.5 md:flex">
          {signedIn ? (
            <form action={logout}>
              <button type="submit" className="btn btn-ghost">
                Sign out
              </button>
            </form>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost">
                Log In
              </Link>
              <Link href="/register" className="btn btn-blue">
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-navy md:hidden"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-border bg-white md:hidden">
          <ul className="mx-auto flex max-w-[1100px] list-none flex-col gap-1 px-5 py-3">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`block rounded-lg px-3 py-2.5 text-sm font-semibold ${
                    isActive(link.href)
                      ? "bg-sky-50 text-brand"
                      : "text-ink-muted hover:bg-sky-50 hover:text-brand"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
              {signedIn ? (
                <form action={logout}>
                  <button
                    type="submit"
                    className="btn btn-ghost w-full justify-center"
                  >
                    Sign out
                  </button>
                </form>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="btn btn-ghost w-full justify-center"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setOpen(false)}
                    className="btn btn-blue w-full justify-center"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
}
