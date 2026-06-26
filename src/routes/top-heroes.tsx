import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "../components/app-shell";
import { TopHeroes } from "../components/top-heroes";

export const Route = createFileRoute("/top-heroes")({
  head: () => ({
    meta: [
      { title: "Top Heroes — CivicSnap" },
      { name: "description", content: "Community leaderboard, points, and milestone badges." },
    ],
  }),
  component: () => (
    <AppShell>
      <TopHeroes />
    </AppShell>
  ),
});