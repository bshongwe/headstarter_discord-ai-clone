"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./_components/sidebar";
import { RedirectToSignIn } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Authenticated>
        <SidebarProvider>
          <DashboardSidebar />
          {children}
          <Toaster />
        </SidebarProvider>
      </Authenticated>
      <Unauthenticated>
        <RedirectToSignIn />
      </Unauthenticated>
    </>
  );
}
