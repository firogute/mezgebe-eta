"use client";

import { useEffect, useMemo, useState } from "react";

type CountdownTextProps = {
  deadline: string | Date;
  showLabel?: boolean;
};

function formatCountdown(deadlineMs: number) {
  const now = Date.now();
  const diff = deadlineMs - now;
  if (diff <= 0) {
    return "Ended";
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${days}d:${hours}h:${minutes}m:${seconds}s`;
}

export function CountdownText({
  deadline,
  showLabel = true,
}: CountdownTextProps) {
  const deadlineMs = useMemo(
    () =>
      deadline instanceof Date
        ? deadline.getTime()
        : new Date(deadline).getTime(),
    [deadline],
  );

  const [text, setText] = useState(() => formatCountdown(deadlineMs));

  useEffect(() => {
    const update = () => setText(formatCountdown(deadlineMs));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [deadlineMs]);

  return <>{showLabel ? `Ends in ${text}` : text}</>;
}
