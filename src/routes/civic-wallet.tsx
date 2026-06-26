import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { CivicWallet } from "@/components/civic-wallet";

export const Route = createFileRoute("/civic-wallet")({
  head: () => ({
    meta: [
      { title: "Civic Wallet — CivicSnap" },
      { name: "description", content: "Earn Civic Points, redeem rewards, and pay via UPI from your CivicSnap wallet." },
    ],
  }),
  component: () => (
    <AppShell>
      <CivicWallet />
    </AppShell>
  ),
});