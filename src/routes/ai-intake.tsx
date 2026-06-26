import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { AIIntake } from "@/components/ai-intake";

export const Route = createFileRoute("/ai-intake")({
  head: () => ({
    meta: [
      { title: "AI Intake — CivicSnap" },
      { name: "description", content: "Zero-friction reporting. Snap a photo or record a voice note — Gemini extracts location, category, and urgency automatically." },
      { property: "og:title", content: "AI Intake — CivicSnap" },
      { property: "og:description", content: "Snap, speak, submit. AI-powered hyperlocal incident intake." },
    ],
  }),
  component: () => (
    <AppShell>
      <AIIntake />
    </AppShell>
  ),
});