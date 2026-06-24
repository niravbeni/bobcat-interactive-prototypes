"use client";

import { AppShell } from "@/components/chrome/AppShell";
import { TabPlaceholder } from "@/components/v2/TabPlaceholder";

export function MarketplaceScreen() {
  return (
    <AppShell fill hideSidebar>
      <TabPlaceholder
        title="Marketplace coming soon"
        copy="Browse curated products and services that fit your outlook. This is a placeholder while we design the real experience."
      />
    </AppShell>
  );
}
