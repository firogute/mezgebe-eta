"use client";

import { useState, useEffect } from "react";
import { checkUsername, registerUsername } from "@/lib/actions/user";
import { reserveTickets } from "@/lib/actions/reserve";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { normalizeEthiopianPhone } from "@/lib/phone";
import { useToast } from "@/components/ui/ToastProvider";

function getTicketDisplayNumber(ticketNumber: string) {
  const parts = ticketNumber.split("-");
  return parts[parts.length - 1] || ticketNumber;
}

export default function TicketSelector({
  eventId,
  ticketPrice,
  availableTickets,
}: {
  eventId: string;
  ticketPrice: number;
  availableTickets: Array<{ id: string; ticketNumber: string }>;
}) {
  const [ownedUsername, setOwnedUsername] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }
    return localStorage.getItem("mezgebe_username") || "";
  });
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [username, setUsername] = useState(ownedUsername);
  const [usernameStatus, setUsernameStatus] = useState<
    "IDLE" | "CHECKING" | "AVAILABLE" | "TAKEN"
  >("IDLE");
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState("");
  const [ticketSearch, setTicketSearch] = useState("");
  const [phone, setPhone] = useState("");
  const [usernameNeedsPhone, setUsernameNeedsPhone] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const isOwnedUsername = username.length >= 3 && username === ownedUsername;
  const displayUsernameStatus = isOwnedUsername ? "OWNED" : usernameStatus;
  const maxAllowed = Math.min(10, availableTickets.length);
  const normalizedSearch = ticketSearch.trim().toLowerCase();
  const filteredTickets = normalizedSearch
    ? availableTickets.filter(
        (ticket) =>
          ticket.ticketNumber.toLowerCase().includes(normalizedSearch) ||
          getTicketDisplayNumber(ticket.ticketNumber)
            .toLowerCase()
            .includes(normalizedSearch),
      )
    : availableTickets;
  const selectedTickets = availableTickets.filter((ticket) =>
    selectedTicketIds.includes(ticket.id),
  );
  const normalizedPhoneInput = phone.trim()
    ? normalizeEthiopianPhone(phone)
    : null;

  // Debounce Username Check
  useEffect(() => {
    if (!username || username.length < 3) {
      return;
    }

    if (username === ownedUsername) {
      return;
    }

    const timer = setTimeout(async () => {
      setUsernameStatus("CHECKING");
      const res = await checkUsername(username);
      if (res.available) {
        setUsernameStatus("AVAILABLE");
        setUsernameNeedsPhone(true);
      } else {
        setUsernameStatus("TAKEN");
        setUsernameNeedsPhone(!res.hasPhone);
      }
    }, 600); // 600ms debounce

    return () => clearTimeout(timer);
  }, [ownedUsername, username]);

  // For remembered/owned usernames, explicitly check whether a phone exists.
  useEffect(() => {
    if (!isOwnedUsername) {
      return;
    }

    const run = async () => {
      const res = await checkUsername(username);
      setUsernameNeedsPhone(!res.available && !res.hasPhone);
    };

    run();
  }, [isOwnedUsername, username]);

  const handleRegister = async () => {
    if (username.length < 3) {
      setError("Username must be at least 3 characters.");
      showToast("Please insert a username.", "error");
      return;
    }

    if (displayUsernameStatus === "TAKEN") {
      setError(
        "This username is already registered. You can continue to buy tickets with it.",
      );
      showToast("Username is already registered.", "error");
      return;
    }

    setRegistering(true);
    setError("");

    const normalizedPhone = normalizeEthiopianPhone(phone);
    if (!normalizedPhone) {
      setError(
        "Phone is required. Use 09..., 07..., 2519..., 2517..., +2519..., or +2517....",
      );
      showToast("Phone number is required to register username.", "error");
      setRegistering(false);
      return;
    }

    const result = await registerUsername(username, normalizedPhone);
    if (!result.success) {
      setError(result.error || "Failed to register username");
      showToast(result.error || "Failed to register username", "error");
      setRegistering(false);
      return;
    }

    localStorage.setItem("mezgebe_username", username);
    setOwnedUsername(username);
    setUsernameNeedsPhone(false);
    setUsernameStatus("IDLE");
    showToast("Username registered successfully.", "success");
    setRegistering(false);
  };

  const toggleTicketSelection = (ticketId: string) => {
    setSelectedTicketIds((current) => {
      if (current.includes(ticketId)) {
        return current.filter((id) => id !== ticketId);
      }

      if (current.length >= maxAllowed) {
        setError(`You can select up to ${maxAllowed} tickets.`);
        showToast(`You can select up to ${maxAllowed} tickets.`, "error");
        return current;
      }

      setError("");
      return [...current, ticketId];
    });
  };

  const quickPick = (count: number) => {
    const nextCount = Math.min(count, maxAllowed, availableTickets.length);
    setSelectedTicketIds(
      availableTickets.slice(0, nextCount).map((ticket) => ticket.id),
    );
    setError("");
  };

  const handleReserve = async () => {
    if (username.length < 3) {
      setError("Username must be at least 3 characters.");
      showToast("Please insert username before proceeding.", "error");
      return;
    }

    if (selectedTicketIds.length === 0) {
      setError("Choose at least one ticket number before continuing.");
      showToast("Please choose at least one ticket.", "error");
      return;
    }

    setLoading(true);
    setError("");

    const normalizedPhone = normalizedPhoneInput;

    if (phone.trim() && !normalizedPhone) {
      setError(
        "Use a valid phone format: 09..., 07..., 2519..., 2517..., +2519..., or +2517....",
      );
      showToast("Please insert a valid phone number.", "error");
      setLoading(false);
      return;
    }

    let resolvedStatus: "OWNED" | "AVAILABLE" | "TAKEN" | "CHECKING" | "IDLE" =
      displayUsernameStatus;

    // If user typed manually and debounce has not finished, do an immediate availability check.
    if (
      !isOwnedUsername &&
      (usernameStatus === "IDLE" || usernameStatus === "CHECKING")
    ) {
      setUsernameStatus("CHECKING");
      const lookup = await checkUsername(username);
      resolvedStatus = lookup.available ? "AVAILABLE" : "TAKEN";
      setUsernameStatus(lookup.available ? "AVAILABLE" : "TAKEN");
      setUsernameNeedsPhone(lookup.available || !lookup.hasPhone);
    }

    // AVAILABLE means not yet registered, so require explicit registration first.
    if (resolvedStatus === "AVAILABLE") {
      setError("Please register this username first, then continue.");
      showToast("Please register username first.", "error");
      setLoading(false);
      return;
    }

    const finalLookup = await checkUsername(username);
    if (!finalLookup.available && !finalLookup.hasPhone && !normalizedPhone) {
      setUsernameNeedsPhone(true);
      setError(
        "This username does not have a phone number yet. Add it to continue.",
      );
      showToast("Please insert phone number to continue.", "error");
      setLoading(false);
      return;
    }

    const res = await reserveTickets({
      eventId,
      username,
      ticketIds: selectedTicketIds,
      phone: normalizedPhone || undefined,
    });
    if (res.success && "reservationId" in res) {
      // Save their username locally
      localStorage.setItem("mezgebe_username", username);
      setOwnedUsername(username);
      showToast("Tickets reserved. Continue with payment.", "success");
      router.push(`/payment/${res.reservationId}`);
    } else {
      const message =
        "error" in res ? (res.error as string) : "Failed to reserve tickets";
      showToast(message, "error");
      setError(message);
      setLoading(false);
    }
  };

  const totalPrice = selectedTicketIds.length * ticketPrice;

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Select Tickets</h3>

      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Username Field */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Your Telegram-style Username
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-muted-foreground">
              @
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(
                  e.target.value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase(),
                );
                setUsernameStatus("IDLE");
                setUsernameNeedsPhone(false);
                setError("");
              }}
              className="w-full pl-8 p-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary outline-none"
              placeholder="mezgebe_user"
              disabled={loading || registering}
            />
          </div>
          <div
            className={
              "mt-1 text-xs font-medium h-4 " +
              (displayUsernameStatus === "AVAILABLE"
                ? "text-green-600"
                : displayUsernameStatus === "TAKEN"
                  ? "text-primary"
                  : displayUsernameStatus === "OWNED"
                    ? "text-primary"
                    : "text-muted-foreground")
            }
          >
            {displayUsernameStatus === "CHECKING" && "typing..."}
            {displayUsernameStatus === "AVAILABLE" &&
              `✔ @${username} is available`}
            {displayUsernameStatus === "TAKEN" &&
              `✔ @${username} is already registered. You can continue.`}
            {displayUsernameStatus === "OWNED" && `✔ Verified (Your Username)`}
          </div>

          {(displayUsernameStatus === "AVAILABLE" || usernameNeedsPhone) && (
            <div className="mt-3 space-y-1">
              <label className="block text-sm font-medium text-foreground">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setError("");
                }}
                className="w-full p-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary outline-none"
                placeholder="09..., 07..., 2519..., or +2519..."
                disabled={loading || registering}
              />
              <p className="text-xs text-muted-foreground">
                Required when registering or when this username has no saved
                phone.
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={handleRegister}
            disabled={
              loading ||
              registering ||
              username.length < 3 ||
              !phone.trim() ||
              displayUsernameStatus === "TAKEN" ||
              displayUsernameStatus === "CHECKING" ||
              displayUsernameStatus === "OWNED"
            }
            className="mt-2 px-4 py-2 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50 inline-flex items-center gap-2"
          >
            {registering ? (
              <>
                <LoadingSpinner />
                Registering...
              </>
            ) : displayUsernameStatus === "OWNED" ? (
              "Registered"
            ) : (
              "Register Username"
            )}
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <label className="block text-sm font-medium text-foreground">
              Choose Ticket Numbers (up to {maxAllowed})
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => quickPick(3)}
                disabled={loading || availableTickets.length === 0}
                className="rounded-full border border-border px-3 py-1 text-xs font-medium transition-all duration-200 hover:-translate-y-0.5 hover:bg-muted disabled:opacity-50"
              >
                Pick 3
              </button>
              <button
                type="button"
                onClick={() => quickPick(5)}
                disabled={loading || availableTickets.length === 0}
                className="rounded-full border border-border px-3 py-1 text-xs font-medium transition-all duration-200 hover:-translate-y-0.5 hover:bg-muted disabled:opacity-50"
              >
                Pick 5
              </button>
              <button
                type="button"
                onClick={() => setSelectedTicketIds([])}
                disabled={loading || selectedTicketIds.length === 0}
                className="rounded-full border border-border px-3 py-1 text-xs font-medium transition-all duration-200 hover:-translate-y-0.5 hover:bg-muted disabled:opacity-50"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-muted/30 p-3">
            <input
              type="text"
              value={ticketSearch}
              onChange={(event) => setTicketSearch(event.target.value)}
              placeholder="Search by ticket number..."
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              disabled={loading}
            />
          </div>

          <div className="max-h-72 overflow-y-auto rounded-2xl border border-border bg-muted/20 p-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {filteredTickets.map((ticket) => {
                const isSelected = selectedTicketIds.includes(ticket.id);

                return (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => toggleTicketSelection(ticket.id)}
                    disabled={loading}
                    className={`rounded-xl border px-3 py-3 text-sm font-semibold transition-all duration-200 ${
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground shadow-sm scale-[1.01]"
                        : "border-border bg-card text-foreground hover:-translate-y-0.5 hover:border-primary/40 hover:bg-background"
                    } disabled:opacity-50`}
                  >
                    #{getTicketDisplayNumber(ticket.ticketNumber)}
                  </button>
                );
              })}
            </div>

            {filteredTickets.length === 0 && (
              <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                No ticket number matched your search.
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 transition-all duration-200">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-foreground">
                Selected Tickets
              </span>
              <span className="text-muted-foreground">
                {selectedTicketIds.length} / {maxAllowed}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 min-h-10">
              {selectedTickets.length > 0 ? (
                selectedTickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => toggleTicketSelection(ticket.id)}
                    className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-all duration-200 hover:-translate-y-0.5"
                  >
                    #{getTicketDisplayNumber(ticket.ticketNumber)}
                  </button>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Pick any available ticket numbers. They do not need to be
                  consecutive.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cart Summary */}
      <div className="bg-muted p-4 rounded-xl border border-border mt-6">
        <div className="flex justify-between text-sm mb-1 text-muted-foreground">
          <span>
            {selectedTicketIds.length} x {ticketPrice} Birr
          </span>
        </div>
        <div className="flex justify-between items-end">
          <span className="text-foreground font-medium">Total</span>
          <span className="text-2xl font-bold text-primary">
            {totalPrice} Birr
          </span>
        </div>
      </div>

      <button
        onClick={handleReserve}
        disabled={
          loading ||
          registering ||
          (displayUsernameStatus === "CHECKING" && !isOwnedUsername)
        }
        className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-medium transition-all duration-200 hover:-translate-y-0.5 hover:opacity-95 disabled:opacity-50 shadow-sm inline-flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <LoadingSpinner />
            Reserving Tickets...
          </>
        ) : (
          "Proceed to Payment"
        )}
      </button>
    </div>
  );
}
