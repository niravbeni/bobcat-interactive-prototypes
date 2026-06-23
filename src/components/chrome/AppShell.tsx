"use client";

import { cn } from "@/lib/cn";
import { Navbar } from "./Navbar";
import { Sidebar, type SidebarProps } from "./Sidebar";

export function AppShell({
  children,
  footer,
  card = true,
  fill = false,
  sidebar,
  customSidebar,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
  card?: boolean;
  /** Lock the shell to the viewport height so inner content scrolls (chat-style). */
  fill?: boolean;
  sidebar?: SidebarProps;
  /** Replace the default <Sidebar/> entirely with a custom node (e.g. V2 chat). */
  customSidebar?: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col bg-white", fill ? "h-screen overflow-hidden" : "min-h-screen")}>
      <div className={cn("flex w-full flex-1 flex-col", fill && "min-h-0")}>
        <Navbar />
        <div className={cn("flex flex-1 gap-5 px-5 py-5 3xl:gap-7 3xl:px-7 3xl:py-6", fill && "min-h-0")}>
          {customSidebar ?? <Sidebar {...sidebar} />}
          <main className={cn("flex min-w-0 flex-1 flex-col", fill && "min-h-0")}>
            <div
              className={cn(
                "flex w-full flex-1 flex-col",
                fill && "min-h-0",
                card && "rounded-field bg-card p-6 xl:p-10 3xl:p-14",
              )}
            >
              {children}
            </div>
            {footer ? <div className="pt-4">{footer}</div> : null}
          </main>
        </div>
      </div>
    </div>
  );
}
