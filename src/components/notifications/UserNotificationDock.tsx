"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { NotificationCenter } from "./NotificationCenter";

export function UserNotificationDock() {
  const pathname = usePathname();
  const [username] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return localStorage.getItem("mezgebe_username");
  });

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-110">
      <NotificationCenter audience="USER" username={username || undefined} />
    </div>
  );
}
