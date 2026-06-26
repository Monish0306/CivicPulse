import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { LiveRadar } from "@/components/live-radar";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Live Radar — CivicSnap" },
      { name: "description", content: "Real-time hyperlocal radar of neighborhood issues, bounties, and active crews." },
      { property: "og:title", content: "Live Radar — CivicSnap" },
      { property: "og:description", content: "Real-time hyperlocal radar of neighborhood issues, bounties, and active crews." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <AppShell>
      <LiveRadar />
    </AppShell>
  );
}
