import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { UserNotificationDock } from "@/components/notifications/UserNotificationDock";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mezgebe Eta | Lightweight Raffle Platform",
  description: "Ticket-Based Ixa / Eta Platform with seamless experience",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} min-h-screen bg-background text-foreground antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ToastProvider>
            {children}
            <UserNotificationDock />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
