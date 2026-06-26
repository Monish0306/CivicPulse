import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Building2,
  Radar,
  Sparkles,
  Users,
  Trophy,
  Wallet,
  CalendarClock,
  LifeBuoy,
  Search,
  Bell,
  Star,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  MapPin,
  Loader2,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

type NavItem = {
  to: string;
  label: string;
  icon: typeof Radar;
  badge?: { text: string; tone: "money" | "pro" };
};

const NAV: NavItem[] = [
  { to: "/", label: "Live Radar", icon: Radar },
  { to: "/ai-intake", label: "AI Intake", icon: Sparkles },
  { to: "/neighborhood-net", label: "Neighborhood Net", icon: Users },
  { to: "/top-heroes", label: "Top Heroes", icon: Trophy },
  { to: "/civic-wallet", label: "Civic Wallet", icon: Wallet, badge: { text: "₹3,250", tone: "money" } },
  { to: "/roster", label: "Roster & Shifts", icon: CalendarClock },
  { to: "/triage-desk", label: "Triage Desk", icon: LifeBuoy, badge: { text: "PRO", tone: "pro" } },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-700">
      <Sidebar pathname={pathname} />
      <Header />
      <main className="md:pl-64 pt-16 min-h-screen">{children}</main>
    </div>
  );
}

function Sidebar({ pathname }: { pathname: string }) {
  return (
    <aside className="hidden md:flex fixed inset-y-0 left-0 z-30 w-64 flex-col bg-white border-r border-slate-200/80">
      <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-200/80">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-linear-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/30">
          <Building2 className="h-5 w-5 text-white" strokeWidth={2.5} />
        </div>
        <span className="text-xl font-bold tracking-tight text-slate-900">CivicSnap</span>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Workspace
        </div>
        {NAV.map((item) => {
          const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors " +
                (active
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900")
              }
            >
              <Icon
                className={
                  "h-[18px] w-[18px] shrink-0 " +
                  (active ? "text-blue-600" : "text-slate-400 group-hover:text-slate-700")
                }
                strokeWidth={2.2}
              />
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge && (
                <span
                  className={
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide " +
                    (item.badge.tone === "money"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-900 text-white")
                  }
                >
                  {item.badge.text}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200/80 p-4">
        <Link to="/login" className="flex items-center gap-3 rounded-2xl p-2 hover:bg-slate-50 transition-colors">
          <div className="relative">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-linear-to-br from-fuchsia-500 to-blue-600 text-white text-sm font-bold">
              AS
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full bg-white">
              <span className="block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-slate-900 truncate">Aarav Sharma</div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <Star className="h-3 w-3 fill-amber-400 stroke-amber-400" />
              <span>Verified Local · Indiranagar</span>
            </div>
          </div>
        </Link>
      </div>
    </aside>
  );
}

function Header() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (!query.trim()) { setSearching(false); return; }
    setSearching(true);
    const t = setTimeout(() => setSearching(false), 450);
    return () => clearTimeout(t);
  }, [query]);

  const SUGGESTIONS = [
    { icon: AlertTriangle, tone: "rose", label: "Pothole on 100 Ft Road, Indiranagar", group: "Issue", to: "/" },
    { icon: AlertTriangle, tone: "amber", label: "Streetlight flickering at Koramangala 5th Block", group: "Issue", to: "/" },
    { icon: AlertTriangle, tone: "rose", label: "Overflowing bin at BTM Layout", group: "Issue", to: "/" },
    { icon: MapPin, tone: "violet", label: "Graffiti on Lalbagh boundary wall", group: "Issue", to: "/" },
    { icon: AlertTriangle, tone: "rose", label: "Open manhole near HSR Layout signal", group: "Issue", to: "/" },
    { icon: MapPin, tone: "blue", label: "Cubbon Park · MG Road", group: "Location", to: "/" },
    { icon: MapPin, tone: "emerald", label: "Whitefield ITPL", group: "Location", to: "/" },
    { icon: MapPin, tone: "violet", label: "Jayanagar 4th Block", group: "Location", to: "/" },
    { icon: Lightbulb, tone: "violet", label: "AI Intake — report a new issue", group: "Feature", to: "/ai-intake" },
    { icon: Users, tone: "blue", label: "Neighborhood Net feed", group: "Feature", to: "/neighborhood-net" },
    { icon: Trophy, tone: "amber", label: "Top Heroes leaderboard", group: "Feature", to: "/top-heroes" },
    { icon: CalendarClock, tone: "emerald", label: "Roster & Shifts schedule", group: "Feature", to: "/roster" },
    { icon: TrendingUp, tone: "blue", label: "Triage Desk · open tickets", group: "Feature", to: "/triage-desk" },
    { icon: Wallet, tone: "emerald", label: "Civic Wallet · rewards & UPI", group: "Feature", to: "/civic-wallet" },
  ] as const;

  const toneClass: Record<string, string> = {
    rose: "bg-rose-50 text-rose-600",
    amber: "bg-amber-50 text-amber-600",
    violet: "bg-violet-50 text-violet-600",
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };

  const q = query.trim().toLowerCase();
  const filtered = q
    ? SUGGESTIONS.filter((s) => s.label.toLowerCase().includes(q))
    : SUGGESTIONS.slice(0, 6);

  return (
    <header className="fixed top-0 inset-x-0 z-20 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/70 md:pl-64">
      <div className="h-full flex items-center gap-4 px-4 sm:px-6">
        <div className="md:hidden flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-2xl bg-linear-to-br from-blue-500 to-blue-700">
            <Building2 className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-bold text-slate-900">CivicSnap</span>
        </div>

        <div className="flex-1 flex justify-center">
          <div ref={boxRef} className="relative w-full max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              placeholder="Search issues, areas (Indiranagar, HSR), crews…"
              className="w-full h-10 rounded-full border border-slate-200 bg-slate-50/70 pl-11 pr-4 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition"
            />
            {open && (
              <div className="absolute left-0 right-0 top-12 rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/70 p-2 max-h-96 overflow-y-auto z-30">
                <div className="px-3 pt-1 pb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {searching ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                      <span className="text-blue-600 normal-case tracking-normal text-[11px] font-semibold">
                        Searching for "{query}" across Bengaluru…
                      </span>
                    </>
                  ) : q ? (
                    <span>{filtered.length} result{filtered.length === 1 ? "" : "s"} for "{query}"</span>
                  ) : (
                    <span>Quick access</span>
                  )}
                </div>
                {filtered.length === 0 && (
                  <div className="px-3 py-6 text-center text-sm text-slate-400">
                    No matches. Try "pothole", "Koramangala", or "wallet".
                  </div>
                )}
                {filtered.map((s) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.label}
                      onClick={() => { setOpen(false); setQuery(""); navigate({ to: s.to }); }}
                      className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-slate-50 transition"
                    >
                      <span className={"grid h-8 w-8 place-items-center rounded-lg " + toneClass[s.tone]}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-slate-800 truncate">{s.label}</div>
                        <div className="text-[11px] text-slate-400">{s.group}</div>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400">↵</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <button className="relative grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-300 transition">
          <Bell className="h-[18px] w-[18px]" strokeWidth={2.2} />
          <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>
      </div>
    </header>
  );
}