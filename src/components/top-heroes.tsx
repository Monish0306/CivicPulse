import { Trophy, Medal, Award, Gem, Plus, Wrench, MessageSquare, Camera } from "lucide-react";

export function TopHeroes() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <header className="text-center">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
          Community Heroes
        </h1>
        <p className="mt-2 text-slate-500">
          Recognizing the neighbors keeping our streets safe, clean, and connected.
        </p>
      </header>

      <HeroCard />

      <div className="grid md:grid-cols-2 gap-6">
        <EarnPoints />
        <Milestones />
      </div>
    </div>
  );
}

function HeroCard() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-blue-900 to-slate-900 p-6 sm:p-8 shadow-xl shadow-blue-900/30">
      <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-fuchsia-500/10 blur-3xl" />

      <div className="relative grid sm:grid-cols-[auto_1fr] gap-6 items-center">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-linear-to-br from-fuchsia-500 to-blue-600 text-white text-2xl font-black ring-4 ring-blue-400/70">
              JD
            </div>
            <div className="absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-full bg-linear-to-br from-slate-300 to-slate-500 ring-4 ring-slate-900 shadow-lg">
              <Medal className="h-4 w-4 text-white" />
            </div>
          </div>
          <div>
            <div className="text-white text-2xl font-black">Aarav Mehta</div>
            <div className="text-blue-300 font-semibold">Your Rank: #42 · Bengaluru</div>
            <div className="text-xs text-slate-400 mt-1">Silver Tier · 240 Points</div>
          </div>
        </div>

        <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-200">Next: Gold Badge</span>
            <span className="font-mono text-amber-300 font-bold">240 / 500 pts</span>
          </div>
          <div className="mt-3 h-2.5 rounded-full bg-white/15 overflow-hidden">
            <div
              className="h-full rounded-full bg-linear-to-r from-amber-400 to-amber-600 shadow-[0_0_12px_rgba(251,191,36,0.6)]"
              style={{ width: "48%" }}
            />
          </div>
          <div className="mt-2 text-xs text-slate-300">260 points to your next milestone.</div>
        </div>
      </div>
    </div>
  );
}

function EarnPoints() {
  const items = [
    { icon: Camera, label: "Report an issue", pts: "+5 pts", tone: "bg-blue-100 text-blue-700" },
    { icon: MessageSquare, label: "Verify neighbor report", pts: "+10 pts", tone: "bg-fuchsia-100 text-fuchsia-700" },
    { icon: Wrench, label: "Fix or resolve issue", pts: "+50 pts", tone: "bg-emerald-100 text-emerald-700" },
    { icon: Plus, label: "Onboard a new neighbor", pts: "+25 pts", tone: "bg-amber-100 text-amber-700" },
  ];
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
      <h3 className="font-bold text-slate-900 mb-4">Earn Points</h3>
      <ul className="space-y-3">
        {items.map(({ icon: Icon, label, pts, tone }) => (
          <li
            key={label}
            className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3"
          >
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-white text-slate-700 shadow-sm">
              <Icon className="h-4 w-4" />
            </div>
            <span className="flex-1 text-sm font-medium text-slate-700">{label}</span>
            <span className={"rounded-full px-2.5 py-1 text-xs font-bold " + tone}>{pts}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Milestones() {
  const tiers = [
    { name: "Bronze", icon: Award, color: "from-orange-400 to-orange-700", active: false, done: true },
    { name: "Silver", icon: Medal, color: "from-slate-300 to-slate-500", active: true, done: false },
    { name: "Gold", icon: Trophy, color: "from-amber-400 to-amber-600", active: false, done: false },
    { name: "Diamond", icon: Gem, color: "from-cyan-300 to-blue-500", active: false, done: false },
  ];
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
      <h3 className="font-bold text-slate-900 mb-4">Milestones</h3>
      <div className="grid grid-cols-2 gap-3">
        {tiers.map(({ name, icon: Icon, color, active, done }) => {
          const dim = !active && !done;
          return (
            <div
              key={name}
              className={
                "relative rounded-2xl border p-4 text-center transition " +
                (active
                  ? "border-amber-300 bg-amber-50 ring-4 ring-amber-200/60 shadow-lg shadow-amber-200/40"
                  : "border-slate-200 bg-slate-50 " + (dim ? "opacity-50 grayscale" : ""))
              }
            >
              <div
                className={
                  "mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-linear-to-br text-white shadow-md " +
                  color
                }
              >
                <Icon className="h-6 w-6" />
              </div>
              <div className="mt-2 font-bold text-slate-900">{name}</div>
              <div className="text-[11px] text-slate-500">
                {done ? "Earned" : active ? "Current" : "Locked"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}