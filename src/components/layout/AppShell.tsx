"use client";

import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { MobileTabBar } from "./MobileTabBar";
import { Bootstrap } from "./Bootstrap";
import { Toaster } from "@/components/ui/Toaster";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-md-bg text-md-text-primary">
      <Bootstrap />
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden pb-[calc(56px+env(safe-area-inset-bottom))] md:pb-0">
        {children}
      </main>
      <MobileTabBar />
      <Toaster />
    </div>
  );
}
