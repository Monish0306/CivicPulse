import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "../components/app-shell";
import { Roster } from "../components/roster";

export const Route = createFileRoute("/roster")({
  head: () => ({
    meta: [
      { title: "Roster & Shifts — CivicSnap" },
      { name: "description", content: "Live crew roster, ratings, and the escalation desk." },
    ],
  }),
  component: () => (
    <AppShell>
      <Roster />
    </AppShell>
  ),
});