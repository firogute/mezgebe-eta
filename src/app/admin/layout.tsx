import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
            className="block px-4 py-2 rounded-md hover:bg-muted text-foreground transition-colors"
          >
            Payments
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
        <div className="px-4 md:px-8 py-4 border-b border-border bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/70 flex items-center justify-end">
          <ThemeToggle />
        </div>

        {/* Main Content */}
        <main className="overflow-auto p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
