"use client";

import { AppSidebar } from "@/components/nav/AppSidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppSidebar />
      <div className="app-content">{children}</div>
    </>
  );
}
