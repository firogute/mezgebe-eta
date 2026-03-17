"use client";

import { deleteTicketAdmin, updateTicketAdmin } from "@/lib/actions/admin";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAdminToast } from "@/app/admin/components/AdminToastProvider";

type TicketRow = {
  id: string;
  ticketNumber: string;
  status: "AVAILABLE" | "RESERVED" | "SOLD" | "WINNER";
  eventTitle: string;
  username: string | null;
  phone: string | null;
};

export function TicketManagementTable({ tickets }: { tickets: TicketRow[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "AVAILABLE" | "RESERVED" | "SOLD"
  >("ALL");
  const [eventFilter, setEventFilter] = useState("ALL");

  const events = Array.from(new Set(tickets.map((t) => t.eventTitle))).sort();

  const filteredTickets = tickets.filter((ticket) => {
    if (statusFilter !== "ALL" && ticket.status !== statusFilter) {
      return false;
    }

    if (eventFilter !== "ALL" && ticket.eventTitle !== eventFilter) {
      return false;
    }

    const keyword = query.trim().toLowerCase();
    if (!keyword) {
      return true;
    }

    return (
      ticket.ticketNumber.toLowerCase().includes(keyword) ||
      ticket.eventTitle.toLowerCase().includes(keyword) ||
      (ticket.username || "").toLowerCase().includes(keyword) ||
      (ticket.phone || "").toLowerCase().includes(keyword)
    );
  });

  const groupedTickets = filteredTickets.reduce<Record<string, TicketRow[]>>(
    (acc, ticket) => {
      if (!acc[ticket.eventTitle]) {
        acc[ticket.eventTitle] = [];
      }
      acc[ticket.eventTitle].push(ticket);
      return acc;
    },
    {},
  );

  const groupedEntries = Object.entries(groupedTickets).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  const stats = {
    total: filteredTickets.length,
    available: filteredTickets.filter((t) => t.status === "AVAILABLE").length,
    reserved: filteredTickets.filter((t) => t.status === "RESERVED").length,
    sold: filteredTickets.filter((t) => t.status === "SOLD").length,
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs uppercase text-muted-foreground">Total</p>
          <p className="text-2xl font-bold mt-1">{stats.total}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs uppercase text-muted-foreground">Available</p>
          <p className="text-2xl font-bold mt-1 text-primary">
            {stats.available}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs uppercase text-muted-foreground">Reserved</p>
          <p className="text-2xl font-bold mt-1 text-accent">
            {stats.reserved}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs uppercase text-muted-foreground">Sold</p>
          <p className="text-2xl font-bold mt-1">{stats.sold}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by ticket, event, or username"
          className="w-full p-2 border border-border rounded-md bg-background text-sm"
        />
        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value as "ALL" | "AVAILABLE" | "RESERVED" | "SOLD",
            )
          }
          className="p-2 border border-border rounded-md bg-background text-sm"
        >
          <option value="ALL">All Status</option>
          <option value="AVAILABLE">Available</option>
          <option value="RESERVED">Reserved</option>
          <option value="SOLD">Sold</option>
        </select>
        <select
          value={eventFilter}
          onChange={(event) => setEventFilter(event.target.value)}
          className="p-2 border border-border rounded-md bg-background text-sm"
        >
          <option value="ALL">All Events</option>
          {events.map((eventTitle) => (
            <option key={eventTitle} value={eventTitle}>
              {eventTitle}
            </option>
          ))}
        </select>
      </div>

      {groupedEntries.length === 0 ? (
        <div className="p-8 text-center bg-card border border-border rounded-xl text-muted-foreground">
          No tickets match your filters.
        </div>
      ) : (
        groupedEntries.map(([eventTitle, eventTickets]) => (
          <details
            key={eventTitle}
            open
            className="bg-card border border-border rounded-xl overflow-hidden"
          >
            <summary className="list-none p-4 border-b border-border flex items-center justify-between bg-muted/40">
              <div>
                <p className="font-semibold text-foreground">{eventTitle}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {eventTickets.length} ticket
                  {eventTickets.length > 1 ? "s" : ""}
                </p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full border border-border text-muted-foreground">
                Expand / Collapse
              </span>
            </summary>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-muted text-muted-foreground text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3">Ticket</th>
                    <th className="px-4 py-3">Owner</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {eventTickets.map((ticket) => (
                    <TicketRowEditor key={ticket.id} ticket={ticket} />
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        ))
      )}
    </div>
  );
}

function TicketRowEditor({ ticket }: { ticket: TicketRow }) {
  const [ticketNumber, setTicketNumber] = useState(ticket.ticketNumber);
  const [status, setStatus] = useState(ticket.status);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [action, setAction] = useState<"save" | "delete" | null>(null);
  const router = useRouter();
  const { showToast } = useAdminToast();

  const onUpdate = () => {
    setError("");
    setAction("save");
    startTransition(async () => {
      const result = await updateTicketAdmin({
        ticketId: ticket.id,
        ticketNumber,
        status,
      });

      if (!result.success) {
        setError(result.error || "Failed to update ticket.");
        showToast(result.error || "Failed to update ticket.", "error");
        setAction(null);
        return;
      }

      showToast("Ticket updated successfully.", "success");
      router.refresh();
      setAction(null);
    });
  };

  const onDelete = () => {
    const confirmed = window.confirm(
      "Delete this ticket? This is allowed only for AVAILABLE tickets.",
    );
    if (!confirmed) {
      return;
    }

    setError("");
    setAction("delete");
    startTransition(async () => {
      const result = await deleteTicketAdmin({ ticketId: ticket.id });
      if (!result.success) {
        setError(result.error || "Failed to delete ticket.");
        showToast(result.error || "Failed to delete ticket.", "error");
        setAction(null);
        return;
      }

      showToast("Ticket deleted successfully.", "success");
      router.refresh();
      setAction(null);
    });
  };

  return (
    <tr className="border-t border-border align-top">
      <td className="px-4 py-3">
        <input
          value={ticketNumber}
          onChange={(event) =>
            setTicketNumber(event.target.value.toUpperCase())
          }
          disabled={isPending}
          className="w-44 p-2 border border-border rounded-md bg-background text-sm font-mono"
        />
      </td>
      <td className="px-4 py-3 text-sm">
        {ticket.username ? `@${ticket.username}` : "-"}
      </td>
      <td className="px-4 py-3 text-sm">{ticket.phone || "-"}</td>
      <td className="px-4 py-3">
        <select
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as "AVAILABLE" | "RESERVED" | "SOLD")
          }
          disabled={isPending}
          className="p-2 border border-border rounded-md bg-background text-sm"
        >
          <option value="AVAILABLE">AVAILABLE</option>
          <option value="RESERVED">RESERVED</option>
          <option value="SOLD">SOLD</option>
        </select>
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onUpdate}
            disabled={isPending}
            className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm disabled:opacity-50 inline-flex items-center gap-2"
          >
            {isPending && action === "save" ? (
              <>
                <LoadingSpinner />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={isPending}
            className="px-3 py-2 rounded-md bg-red-100 text-red-700 text-sm disabled:opacity-50 inline-flex items-center gap-2"
          >
            {isPending && action === "delete" ? (
              <>
                <LoadingSpinner />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </td>
    </tr>
  );
}
