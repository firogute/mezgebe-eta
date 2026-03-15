"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const ADMIN_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/create-eta", label: "Create Eta / Ixa" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/tickets", label: "Tickets" },
  { href: "/admin/ticket-style", label: "Ticket Style" },
];

export function AdminMobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden border-b border-border bg-card/90 backdrop-blur supports-backdrop-filter:bg-card/70">
      <div className="flex items-center justify-between px-4 py-2.5">
        <p className="text-sm font-semibold text-foreground">
          Admin Navigation
        </p>
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-label={open ? "Close admin menu" : "Open admin menu"}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-muted"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-border px-3 py-3">
          <div className="space-y-1">
            {ADMIN_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
