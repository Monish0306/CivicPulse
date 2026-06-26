import { toast } from "sonner";
import { Sparkles, Route as RouteIcon, AlertOctagon, MapPin, Clock } from "lucide-react";

export function TriageDesk() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
            Triage & Dispatch
          </h1>
          <span className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">
            City Official Portal
          </span>
        </div>
        <button
          onClick={() =>
            toast.success("AI Route Optimization started", {
              description: "Re-routing 3 crews to minimize travel time.",
            })
          }
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow-md hover:bg-slate-800 transition"
        >
          <Sparkles className="h-4 w-4 text-amber-300" />
          AI Route Optimization
        </button>
      </header>

      <section className="relative overflow-hidden rounded-3xl bg-slate-900/85 backdrop-blur-md p-6 sm:p-8 text-white border border-white/10 shadow-2xl">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-purple-600/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-blue-600/20 blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-purple-500/20 text-purple-300">
              <Sparkles className="h-5 w-5" />
            </div>
            <h2 className="font-bold text-lg">Gemini Morning Briefing</h2>
            <span className="ml-auto text-[11px] font-mono text-slate-400">06:42 AM · Today</span>
          </div>

          <p className="mt-4 leading-relaxed text-slate-200">
            <span className="font-bold text-white">Summary:</span> Indiranagar zone has a critical
            cluster on <span className="text-amber-300">100 Ft Road</span> (4 severe potholes in 12
            hours). Sweeper team is currently in Koramangala. Cubbon Park district is calm.
          </p>

          <div className="mt-5 rounded-2xl bg-white/5 border border-white/10 p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-purple-300">
              Recommendation
            </div>
            <p className="mt-1 leading-relaxed">
              Dispatch <span className="text-blue-300 font-semibold">Crew Alpha</span> to{" "}
              <span className="text-blue-300 font-semibold">100 Ft Road, Indiranagar</span> to mitigate a predicted{" "}
              <span className="text-purple-300 font-semibold">35% increase</span> in evening
              congestion at the CMH signal.
            </p>
          </div>
        </div>
      </section>

      <section className="grid lg:grid-cols-3 gap-4">
        <StatTile label="Open Tickets" value="24" tone="blue" icon={AlertOctagon} />
        <StatTile label="Avg Response" value="38m" tone="emerald" icon={Clock} />
        <StatTile label="Hotspots" value="3" tone="amber" icon={MapPin} />
      </section>

      <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-900">Dispatch Queue</h2>
          <button
            onClick={() => toast("Queue refreshed")}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            <RouteIcon className="h-3.5 w-3.5" />
            Re-route
          </button>
        </div>
        <ul className="divide-y divide-slate-100">
          {[
            { id: "BLR-2014", title: "Severe pothole cluster", loc: "100 Ft Rd, Indiranagar", crew: "Alpha", urgency: "Critical" },
            { id: "BLR-2015", title: "Overflowing garbage bin", loc: "BTM Layout 2nd Stage", crew: "Bravo", urgency: "High" },
            { id: "BLR-2016", title: "Broken streetlight", loc: "Koramangala 5th Block", crew: "Charlie", urgency: "Med" },
            { id: "BLR-2017", title: "Open manhole", loc: "HSR Sector 1 Signal", crew: "Delta", urgency: "Critical" },
          ].map((t) => (
            <li key={t.id} className="py-3 flex items-center gap-4">
              <span className="font-mono text-xs text-slate-500 w-16">{t.id}</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-900 truncate">{t.title}</div>
                <div className="text-xs text-slate-500">{t.loc} · Assigned to Crew {t.crew}</div>
              </div>
              <span
                className={
                  "rounded-full px-2.5 py-1 text-[11px] font-bold " +
                  (t.urgency === "Critical"
                    ? "bg-red-100 text-red-700"
                    : t.urgency === "High"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-blue-100 text-blue-700")
                }
              >
                {t.urgency}
              </span>
              <button
                onClick={() => toast.success(`Dispatched Crew ${t.crew} to ${t.loc}`)}
                className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800"
              >
                Dispatch
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function StatTile({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  tone: "blue" | "emerald" | "amber";
  icon: typeof MapPin;
}) {
  const toneMap = {
    blue: "bg-blue-100 text-blue-700",
    emerald: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
      <div className={"grid h-12 w-12 place-items-center rounded-2xl " + toneMap[tone]}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</div>
        <div className="text-2xl font-black text-slate-900">{value}</div>
      </div>
    </div>
  );
}