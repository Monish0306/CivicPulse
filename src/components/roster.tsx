import { useState } from "react";
import { toast } from "sonner";
import { Star, Mail, Mic, FileWarning, AlertTriangle, Truck } from "lucide-react";

type Crew = {
  initials: string;
  name: string;
  role: string;
  status: "On Duty" | "On Leave" | "En Route";
  statusTone: "emerald" | "red" | "amber";
  shift: string;
  vehicle: string;
  rating: number;
  votes: number;
};

const INITIAL_CREW: Crew[] = [
  { initials: "RK", name: "Ravi Kumar", role: "Lead Sweeper · Indiranagar", status: "On Duty", statusTone: "emerald", shift: "06:00 - 14:00", vehicle: "KA 01 MA 4521", rating: 4, votes: 128 },
  { initials: "PS", name: "Priya Sharma", role: "Sanitation Tech · Koramangala", status: "On Leave", statusTone: "red", shift: "Unavailable Today", vehicle: "KA 05 MN 1190", rating: 5, votes: 96 },
  { initials: "AI", name: "Arjun Iyer", role: "Pothole Crew · HSR Layout", status: "En Route", statusTone: "amber", shift: "07:00 - 15:00", vehicle: "KA 03 EQ 8821", rating: 5, votes: 211 },
  { initials: "MR", name: "Meera Reddy", role: "Streetlight Crew · Jayanagar", status: "On Duty", statusTone: "emerald", shift: "09:00 - 17:00", vehicle: "KA 02 BX 7733", rating: 4, votes: 64 },
];

export function Roster() {
  const [crew, setCrew] = useState<Crew[]>(INITIAL_CREW);

  const rate = (idx: number, stars: number) => {
    setCrew((prev) => {
      const next = [...prev];
      const c = next[idx];
      const newVotes = c.votes + 1;
      const newRating = (c.rating * c.votes + stars) / newVotes;
      next[idx] = { ...c, rating: newRating, votes: newVotes };
      return next;
    });
    toast.success(`Rated ${stars}★ — thanks for the feedback!`, {
      description: "Updated on the public dashboard.",
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
          Civic Directory & Operations
        </h1>
        <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">
          BBMP Transparency Portal
        </span>
      </header>

      <section>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Community Leadership</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <LeaderCard name="Dr. Ramesh Naik" role="Ward Corporator · Ward 76" initials="RN" tone="indigo" />
          <LeaderCard name="Smt. Sunitha Rao" role="BBMP District Liaison" initials="SR" tone="blue" />
          <LeaderCard name="Insp. Karthik Gowda" role="Indiranagar PS · Safety Lead" initials="KG" tone="emerald" />
        </div>
      </section>

      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">Live Shift Dashboard · Bengaluru Zone</h2>
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Live Roster
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50/70 text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="text-left px-6 py-3 font-semibold">Worker</th>
                <th className="text-left px-6 py-3 font-semibold">Status</th>
                <th className="text-left px-6 py-3 font-semibold">Shift</th>
                <th className="text-left px-6 py-3 font-semibold">Vehicle</th>
                <th className="text-left px-6 py-3 font-semibold">Rate this worker</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {crew.map((c, i) => (
                <CrewRow key={c.name} crew={c} onRate={(s) => rate(i, s)} />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-red-50 border border-red-100 rounded-3xl p-6">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-red-100 text-red-600 shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-red-900">Accountability & Escalation Desk</h2>
            <p className="mt-1 text-sm text-red-800/80">
              If the BBMP team is unresponsive, escalate immediately. All escalations are logged
              and reviewed by the city ombudsman within 24 hours.
            </p>
          </div>
        </div>

        <div className="mt-5 grid sm:grid-cols-2 gap-3">
          <button
            onClick={() =>
              toast.error("Recording voice escalation…", {
                description: "Hold and speak. Release to send to the ombudsman.",
              })
            }
            className="group flex items-center justify-center gap-3 rounded-2xl bg-white border-2 border-red-200 px-5 py-4 font-semibold text-red-700 hover:border-red-300 hover:shadow-md transition"
          >
            <Mic className="h-5 w-5 text-red-600 transition-transform group-hover:scale-125" />
            Hold to Voice Record
          </button>
          <button
            onClick={() => toast.success("Written complaint filed (Case #BBMP-2918)")}
            className="flex items-center justify-center gap-3 rounded-2xl bg-red-600 px-5 py-4 font-semibold text-white shadow-md shadow-red-500/30 hover:bg-red-700 transition"
          >
            <FileWarning className="h-5 w-5" />
            File Written Complaint
          </button>
        </div>
      </section>
    </div>
  );
}

function LeaderCard({
  name,
  role,
  initials,
  tone,
}: {
  name: string;
  role: string;
  initials: string;
  tone: "indigo" | "blue" | "emerald";
}) {
  const borderMap = {
    indigo: "border-l-indigo-500",
    blue: "border-l-blue-500",
    emerald: "border-l-emerald-500",
  };
  const avatarMap = {
    indigo: "from-indigo-500 to-indigo-700",
    blue: "from-blue-500 to-blue-700",
    emerald: "from-emerald-500 to-emerald-700",
  };
  return (
    <div
      className={
        "bg-white rounded-2xl border border-slate-200 border-l-4 p-5 shadow-sm " + borderMap[tone]
      }
    >
      <div className="flex items-center gap-3">
        <div
          className={
            "grid h-12 w-12 place-items-center rounded-full text-white text-sm font-bold bg-linear-to-br " +
            avatarMap[tone]
          }
        >
          {initials}
        </div>
        <div className="min-w-0">
          <div className="font-bold text-slate-900 truncate">{name}</div>
          <div className="text-xs text-slate-500">{role}</div>
        </div>
      </div>
      <button
        onClick={() => toast(`Contact request sent to ${name}`)}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
      >
        <Mail className="h-3.5 w-3.5" />
        Contact
      </button>
    </div>
  );
}

function CrewRow({ crew, onRate }: { crew: Crew; onRate: (s: number) => void }) {
  const [hover, setHover] = useState(0);
  const display = Math.round(crew.rating * 10) / 10;
  const statusClass =
    crew.statusTone === "emerald"
      ? "bg-emerald-100 text-emerald-700"
      : crew.statusTone === "red"
      ? "bg-red-100 text-red-700"
      : "bg-amber-100 text-amber-700";
  return (
    <tr className="hover:bg-slate-50/60">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-linear-to-br from-slate-600 to-slate-800 text-white text-xs font-bold">
            {crew.initials}
          </div>
          <div>
            <div className="font-semibold text-slate-900">{crew.name}</div>
            <div className="text-xs text-slate-500">{crew.role}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={"inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold " + statusClass}>
          {crew.status}
        </span>
      </td>
      <td className="px-6 py-4 font-mono text-xs text-slate-700">{crew.shift}</td>
      <td className="px-6 py-4">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2 py-1 font-mono text-[11px] font-bold text-slate-700">
          <Truck className="h-3 w-3 text-slate-500" />
          {crew.vehicle}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5" onMouseLeave={() => setHover(0)}>
            {Array.from({ length: 5 }).map((_, i) => {
              const filled = i < (hover || Math.round(crew.rating));
              return (
                <button
                  key={i}
                  type="button"
                  onMouseEnter={() => setHover(i + 1)}
                  onClick={() => onRate(i + 1)}
                  className="p-0.5 transition-transform hover:scale-125"
                  aria-label={`Rate ${i + 1} star`}
                >
                  <Star
                    className={
                      "h-4 w-4 transition-colors " +
                      (filled
                        ? "fill-amber-400 stroke-amber-400"
                        : "fill-slate-200 stroke-slate-300")
                    }
                  />
                </button>
              );
            })}
          </div>
          <span className="text-[11px] font-bold text-slate-600">{display.toFixed(1)}</span>
          <span className="text-[10px] text-slate-400">({crew.votes})</span>
        </div>
      </td>
    </tr>
  );
}