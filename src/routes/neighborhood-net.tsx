import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "../components/app-shell";
import { NeighborhoodNet } from "../components/neighborhood-net";

export const Route = createFileRoute("/neighborhood-net")({
  head: () => ({
    meta: [
      { title: "Neighborhood Net — CivicSnap" },
      { name: "description", content: "A trusted social feed for civic action and neighbor introductions." },
    ],
  }),
  component: () => (
    <AppShell>
      <NeighborhoodNet />
    </AppShell>
  ),
});