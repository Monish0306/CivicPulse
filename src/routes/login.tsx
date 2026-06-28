import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect } from "react";

const LoginPage = lazy(() =>
  import("@/components/login-page").then((m) => ({ default: m.LoginPage }))
);

export const Route = createFileRoute("/login")({
  ssr: false,
  component: () => {
    useEffect(() => {
      async function checkAuth() {
        const { onAuthStateChanged } = await import("firebase/auth");
        const { auth } = await import("@/lib/firebase");
        onAuthStateChanged(auth, (user) => {
          if (user) window.location.href = "/";
        });
      }
      checkAuth();
    }, []);

    return (
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
        </div>
      }>
        <LoginPage />
      </Suspense>
    );
  },
});