"use client";

import { useState } from "react";

export function CleanupButton() {
  const [loading, setLoading] = useState(false);

  const handleCleanup = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const response = await fetch("/api/cleanup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const result = await response.json();
      if (result.success) {
        alert(
          `Cleanup completed! Released ${result.data.releasedCount} expired reservations and cleaned ${result.data.cleanedCount} old records.`,
        );
        window.location.reload();
      } else {
        alert("Cleanup failed: " + result.error);
      }
    } catch (error) {
      alert("Error running cleanup: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCleanup}
      disabled={loading}
      className="rounded-full border border-orange-500 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 transition-colors hover:bg-orange-100 disabled:opacity-50 dark:bg-orange-950 dark:text-orange-300 dark:hover:bg-orange-900"
    >
      {loading ? "🧹 Cleaning..." : "🧹 Cleanup Expired"}
    </button>
  );
}
