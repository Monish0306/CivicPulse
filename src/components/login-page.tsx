import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Building2,
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  MapPin,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";

type Mode = "login" | "signup";

export function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const navigate = useNavigate();

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") {
      if (!form.email || !form.password) {
        toast.error("Enter your email and password to continue.");
        return;
      }
    } else {
      if (!form.name || !form.email || !form.phone || !form.password) {
        toast.error("Please fill every field to create your CivicSnap account.");
        return;
      }
      if (form.password.length < 6) {
        toast.error("Password must be at least 6 characters.");
        return;
      }
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success(
        mode === "login"
          ? "Welcome back to CivicSnap, Aarav!"
          : "Account created — welcome to CivicSnap!",
      );
      navigate({ to: "/" });
    }, 900);
  };

  return (
    <div className="min-h-screen flex bg-slate-950 text-white">
      {/* Left brand panel */}
      <aside className="relative hidden lg:flex w-[46%] flex-col justify-between overflow-hidden bg-linear-to-br from-blue-700 via-indigo-700 to-fuchsia-700 p-12">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(255,255,255,.25), transparent 40%), radial-gradient(circle at 80% 70%, rgba(255,255,255,.2), transparent 45%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15 backdrop-blur-xl ring-1 ring-white/30 shadow-lg">
            <Building2 className="h-6 w-6 text-white" strokeWidth={2.4} />
          </div>
          <div>
            <div className="text-2xl font-black tracking-tight">CivicSnap</div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-white/70">
              Hyperlocal Civic OS · India
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-xl px-3 py-1.5 ring-1 ring-white/25 text-[11px] font-semibold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" /> Powered by Gemini AI
          </div>
          <h1 className="mt-5 text-4xl xl:text-5xl font-black leading-[1.05] tracking-tight">
            Your street.<br />Your city.<br />
            <span className="bg-linear-to-r from-amber-300 to-emerald-300 bg-clip-text text-transparent">
              One snap away.
            </span>
          </h1>
          <p className="mt-5 max-w-md text-white/80 text-[15px] leading-relaxed">
            Join 2.4 lakh residents across Bengaluru, Mumbai, Delhi & Hyderabad
            who report potholes, garbage, broken lights and unsafe streets — and
            watch BBMP crews resolve them in real time.
          </p>

          <ul className="mt-7 space-y-3 text-sm">
            {[
              "Live BBMP crew tracking on Google Maps",
              "Earn ₹ Civic Wallet points for every verified report",
              "Rate workers · escalate to ombudsman in one tap",
            ].map((t) => (
              <li key={t} className="flex items-center gap-3 text-white/90">
                <CheckCircle2 className="h-5 w-5 text-emerald-300 shrink-0" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center gap-3 text-[11px] text-white/70">
          <ShieldCheck className="h-4 w-4 text-emerald-300" />
          End-to-end encrypted · Aadhaar-grade verification · DPDP Act compliant
        </div>
      </aside>

      {/* Right form */}
      <main className="flex-1 flex flex-col bg-white text-slate-800">
        <div className="flex items-center justify-between px-6 lg:px-10 py-6">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800">
            <MapPin className="h-4 w-4" /> Back to live radar
          </Link>
          <div className="text-sm text-slate-500">
            {mode === "login" ? "New here?" : "Already a member?"}{" "}
            <button
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              {mode === "login" ? "Create an account" : "Sign in"}
            </button>
          </div>
        </div>

        <div className="flex-1 grid place-items-center px-6 lg:px-10 pb-10">
          <div className="w-full max-w-md">
            <div className="inline-flex rounded-full bg-slate-100 p-1 text-sm font-semibold">
              {(["login", "signup"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={
                    "px-5 py-1.5 rounded-full transition " +
                    (mode === m
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700")
                  }
                >
                  {m === "login" ? "Sign in" : "Create account"}
                </button>
              ))}
            </div>

            <h2 className="mt-6 text-3xl font-black tracking-tight text-slate-900">
              {mode === "login" ? "Welcome back" : "Join CivicSnap"}
            </h2>
            <p className="mt-1.5 text-sm text-slate-500">
              {mode === "login"
                ? "Sign in to continue reporting and tracking issues in your neighbourhood."
                : "Create your free account in under a minute — no paperwork needed."}
            </p>

            <form onSubmit={submit} className="mt-7 space-y-4">
              {mode === "signup" && (
                <Field icon={User} label="Full name" placeholder="e.g. Aarav Sharma" value={form.name} onChange={set("name")} />
              )}
              <Field icon={Mail} type="email" label="Email" placeholder="you@example.in" value={form.email} onChange={set("email")} />
              {mode === "signup" && (
                <Field icon={Phone} type="tel" label="Mobile number" placeholder="+91 98xxxxxx12" value={form.phone} onChange={set("phone")} />
              )}
              <div>
                <label className="text-xs font-semibold text-slate-600">Password</label>
                <div className="mt-1.5 relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={showPw ? "text" : "password"}
                    placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
                    value={form.password}
                    onChange={set("password")}
                    className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-10 text-sm outline-none focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    aria-label="Toggle password"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {mode === "login" && (
                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 text-slate-600">
                    <input type="checkbox" className="rounded border-slate-300" defaultChecked /> Keep me signed in
                  </label>
                  <button type="button" onClick={() => toast("Reset link sent if the email exists.")} className="font-semibold text-blue-600 hover:text-blue-700">
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? "Please wait…" : mode === "login" ? "Sign in to CivicSnap" : "Create my account"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                    or continue with
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const { GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
                      const { auth } = await import("@/lib/firebase");
                      const provider = new GoogleAuthProvider();
                      provider.setCustomParameters({ prompt: "select_account" });
                      const result = await signInWithPopup(auth, provider);
                      if (result.user) {
                        toast.success(`Welcome, ${result.user.displayName || "there"}!`);
                        navigate({ to: "/" });
                      }
                    } catch (err: unknown) {
                      const code = (err as { code?: string }).code;
                      if (code === "auth/popup-blocked") {
                        toast.error("Popup blocked. Please allow popups for this site.");
                      } else if (code === "auth/cancelled-popup-request") {
                          // user closed popup, do nothing
                      } else {
                        const msg = err instanceof Error ? err.message : "Sign in failed";
                        toast.error(msg.replace("Firebase: ", "").replace(/\(auth.*\)\.?/, ""));
                      }
                    }                 
                  }}
                 className="h-11 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:border-slate-300 hover:shadow-sm transition flex items-center justify-center gap-2"
                >
                 <GoogleGlyph /> Google
                </button>
                
              </div>
            </form>

            <p className="mt-6 text-center text-[11px] text-slate-400">
              By continuing you agree to CivicSnap's Terms & the DPDP Act 2023 privacy policy.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
}: {
  icon: typeof Mail;
  label: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-600">{label}</label>
      <div className="mt-1.5 relative">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-3 text-sm outline-none focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition"
        />
      </div>
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.1 8 3l5.7-5.7C34 6 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.1 8 3l5.7-5.7C34 6 29.3 4 24 4 16.3 4 9.6 8.4 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.5-5.3l-6.2-5.3C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.5 39.5 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.4-2.4 4.5-4.5 5.9l6.2 5.3C40.9 36 44 30.5 44 24c0-1.3-.1-2.3-.4-3.5z" />
    </svg>
  );
}