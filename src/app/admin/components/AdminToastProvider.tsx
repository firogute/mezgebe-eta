"use client";

import type { ReactNode } from "react";
import {
  ToastProvider,
  useToast,
  type ToastTone,
} from "@/components/ui/ToastProvider";

export function AdminToastProvider({ children }: { children: ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}

export function useAdminToast() {
  const { showToast } = useToast();
  return {
    showToast: (message: string, tone?: ToastTone) => showToast(message, tone),
  };
}
