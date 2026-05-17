import type { ReactNode } from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { SignOutButton } from "@/components/shared/sign-out-button";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/drivers", label: "Drivers" },
  { href: "/admin/rides", label: "Rides" },
  { href: "/admin/pricing", label: "Pricing" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireRole("admin");
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-4 px-6 py-6">
      <header className="flex items-center justify-between">
        <Link href="/admin" className="text-lg font-semibold tracking-tight">
          Ntole <span className="text-accent">admin</span>
        </Link>
        <SignOutButton />
      </header>
      <nav className="flex gap-2 overflow-x-auto rounded-pill bg-surface p-1 ring-1 ring-white/5 no-scrollbar">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className="whitespace-nowrap rounded-pill px-4 py-2 text-sm text-muted-strong hover:bg-white/5 hover:text-white"
          >
            {n.label}
          </Link>
        ))}
      </nav>
      <main className="flex-1">{children}</main>
    </div>
  );
}
