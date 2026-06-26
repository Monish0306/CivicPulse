import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "../components/app-shell";
import { TriageDesk } from "../components/triage-desk";

export const Route = createFileRoute("/triage-desk")({
  head: () => ({
    meta: [
      { title: "Triage Desk — CivicSnap" },
      { name: "description", content: "City official triage and dispatch portal with Gemini briefing." },
    ],
  }),
  component: () => (
    <AppShell>
      <TriageDesk />
    </AppShell>
  ),
});