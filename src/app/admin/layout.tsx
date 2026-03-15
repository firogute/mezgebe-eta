import Link from "next/link";
import prisma from "@/lib/prisma";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { AdminMobileMenu } from "./components/AdminMobileMenu";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pendingPayments = await prisma.payment.count({
    where: { status: "PENDING" },
  });

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border hidden md:flex flex-col">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold tracking-tight text-primary">
            Admin Panel
          </h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link
            href="/admin"
            className="block px-4 py-2 rounded-md hover:bg-muted text-foreground transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/create-eta"
            className="block px-4 py-2 rounded-md hover:bg-muted text-foreground transition-colors"
          >
            Create Eta / Ixa
          </Link>
          <Link
            href="/admin/payments"
            className="flex items-center justify-between gap-2 px-4 py-2 rounded-md hover:bg-muted text-foreground transition-colors"
          >
            <span>Payments</span>
            {pendingPayments > 0 && (
              <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                {pendingPayments}
              </span>
            )}
          </Link>
          <Link
            href="/admin/tickets"
            className="block px-4 py-2 rounded-md hover:bg-muted text-foreground transition-colors"
          >
            Tickets
          </Link>
          <Link
            href="/admin/ticket-style"
            className="block px-4 py-2 rounded-md hover:bg-muted text-foreground transition-colors"
          >
            Ticket Style
          </Link>
        </nav>
      </aside>

      <div className="flex-1 min-w-0">
        <div className="relative z-70 px-4 md:px-8 py-4 border-b border-border bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/70 flex items-center justify-end gap-3">
          <Link
            href="/admin/payments"
            className="relative inline-flex items-center rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
          >
            Notifications
            {pendingPayments > 0 && (
              <>
                <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700">
                  {pendingPayments}
                </span>
                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
              </>
            )}
          </Link>
          <NotificationCenter audience="ADMIN" />
          <ThemeToggle />
        </div>

        <AdminMobileMenu />

        {/* Main Content */}
        <main className="overflow-auto p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
