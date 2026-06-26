import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "@/components/login-page";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — CivicSnap" },
      { name: "description", content: "Sign in to CivicSnap, the hyperlocal civic operating system for Indian neighbourhoods." },
    ],
  }),
  component: LoginPage,
});