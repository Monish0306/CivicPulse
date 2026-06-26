import { useRef, useState } from "react";
import { toast } from "sonner";
import graffitiBefore from "@/assets/graffiti-before.jpg";
import graffitiAfter from "@/assets/graffiti-after.jpg";
import {
  Image as ImageIcon,
  Mic,
  Heart,
  MessageCircle,
  Share2,
  CheckCircle2,
  Users,
  UserPlus,
  Play,
  Pause,
} from "lucide-react";

export function NeighborhoodNet() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
          Neighborhood Net
        </h1>
        <p className="mt-2 text-slate-500">
          A trusted feed for civic action, neighbor introductions, and resolved wins.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6 min-w-0">
          <CreatePostBox />
          <ResolvedIssuePost />
          <VoiceNotePost />
        </div>
        <aside className="space-y-6">
          <BuildNetworkCard />
          <InfluenceCard />
        </aside>
      </div>
    </div>
  );
}

function CreatePostBox() {
  const [text, setText] = useState("");
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm">
      <div className="flex gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-linear-to-br from-fuchsia-500 to-blue-600 text-white text-sm font-bold">
          JD
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          placeholder="What civic action did you take today?"
          className="flex-1 resize-none rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-fuchsia-200"
        />
      </div>
      <div className="mt-4 flex items-center justify-between pl-14">
        <div className="flex items-center gap-1">
          <button className="grid h-9 w-9 place-items-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-fuchsia-600 transition">
            <ImageIcon className="h-[18px] w-[18px]" />
          </button>
          <button className="grid h-9 w-9 place-items-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-fuchsia-600 transition">
            <Mic className="h-[18px] w-[18px]" />
          </button>
        </div>
        <button
          onClick={() => {
            toast.success("Post Update published to your neighbors", {
              description: "+5 Civic Points awarded.",
            });
            setText("");
          }}
          className="rounded-full bg-linear-to-r from-fuchsia-500 to-fuchsia-700 px-5 py-2 text-sm font-bold text-white shadow-md shadow-fuchsia-500/30 hover:shadow-lg hover:shadow-fuchsia-500/40 transition"
        >
          Post Update
        </button>
      </div>
    </div>
  );
}

function PostHeader({
  initials,
  name,
  time,
  badge,
}: {
  initials: string;
  name: string;
  time: string;
  badge?: { text: string; tone: "green" | "blue" };
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-11 w-11 place-items-center rounded-full bg-linear-to-br from-slate-700 to-slate-900 text-white text-sm font-bold">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-900">{name}</span>
          {badge && (
            <span
              className={
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold " +
                (badge.tone === "green"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-blue-100 text-blue-700")
              }
            >
              <CheckCircle2 className="h-3 w-3" />
              {badge.text}
            </span>
          )}
        </div>
        <div className="text-xs text-slate-500">{time}</div>
      </div>
    </div>
  );
}

function PostFooter() {
  return (
    <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 text-sm text-slate-500">
      <button className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl py-2 hover:bg-rose-50 hover:text-rose-600 transition">
        <Heart className="h-4 w-4" /> Like
      </button>
      <button className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl py-2 hover:bg-blue-50 hover:text-blue-600 transition">
        <MessageCircle className="h-4 w-4" /> Comment
      </button>
      <button className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl py-2 hover:bg-slate-100 hover:text-slate-700 transition">
        <Share2 className="h-4 w-4" /> Share
      </button>
    </div>
  );
}

function ResolvedIssuePost() {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm">
      <PostHeader
        initials="MR"
        name="Manoj Rao"
        time="2h ago · Indiranagar 12th Main"
        badge={{ text: "Resolved Issue", tone: "green" }}
      />
      <p className="mt-3 text-slate-700 leading-relaxed">
        Spent the morning scrubbing the graffiti off the BBMP library wall with neighbours.
        Took two hours but it looks brand new. Big thanks to Anjali aunty and the kids who helped!
      </p>
      <BeforeAfterSlider />
      <PostFooter />
    </div>
  );
}

function BeforeAfterSlider() {
  const [pos, setPos] = useState(50);
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const onMove = (clientX: number) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const p = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setPos(p);
  };

  return (
    <div
      ref={ref}
      className="mt-4 relative aspect-[16/10] w-full overflow-hidden rounded-2xl select-none cursor-ew-resize bg-slate-200"
      onMouseDown={(e) => {
        dragging.current = true;
        onMove(e.clientX);
      }}
      onMouseMove={(e) => dragging.current && onMove(e.clientX)}
      onMouseUp={() => (dragging.current = false)}
      onMouseLeave={() => (dragging.current = false)}
      onTouchStart={(e) => onMove(e.touches[0].clientX)}
      onTouchMove={(e) => onMove(e.touches[0].clientX)}
    >
      {/* After image (base, revealed when slider moves left) */}
      <img
        src={graffitiAfter}
        alt="Wall after cleaning"
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />
      <span className="absolute bottom-3 right-3 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow">
        After Fix
      </span>
      {/* Before image (clipped from the left side) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      >
        <img
          src={graffitiBefore}
          alt="Wall before, covered in graffiti"
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
        <span className="absolute bottom-3 left-3 rounded-full bg-slate-900/80 px-3 py-1 text-xs font-bold text-white shadow">
          Before
        </span>
      </div>
      {/* Handle */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.1)]"
        style={{ left: `${pos}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-white shadow-lg">
          <div className="flex gap-0.5">
            <span className="h-3 w-0.5 bg-slate-400" />
            <span className="h-3 w-0.5 bg-slate-400" />
          </div>
        </div>
      </div>
    </div>
  );
}

function VoiceNotePost() {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm">
      <PostHeader
        initials="DV"
        name="Deepa Venkatesh"
        time="5h ago · Jayanagar 4th Block"
        badge={{ text: "Voice Request", tone: "blue" }}
      />
      <p className="mt-3 text-slate-700 leading-relaxed">
        The free book exchange box at the park gate is broken — the hinge snapped. Recorded a
        quick note for whoever can lend a hand this weekend.
      </p>

      <div className="mt-4 flex items-center gap-3 rounded-2xl bg-slate-100 p-3">
        <button
          onClick={() => setPlaying((p) => !p)}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-fuchsia-600 text-white shadow-md hover:bg-fuchsia-700 transition"
        >
          {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 translate-x-0.5" />}
        </button>
        <div className="flex-1">
          <div className="h-1.5 rounded-full bg-slate-300 overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-fuchsia-500 to-fuchsia-700 transition-all"
              style={{ width: playing ? "72%" : "38%" }}
            />
          </div>
        </div>
        <span className="font-mono text-xs font-semibold text-slate-600">0:45</span>
      </div>

      <PostFooter />
    </div>
  );
}

function BuildNetworkCard() {
    const people = [
    { name: "Rohit Kulkarni", role: "Local Carpenter · HSR", initials: "RK" },
    { name: "Sneha Joshi", role: "School Volunteer · BTM", initials: "SJ" },
    { name: "Vikram Bhat", role: "Civil Engineer · Whitefield", initials: "VB" },
  ];
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-xl bg-fuchsia-100 text-fuchsia-600">
          <Users className="h-4 w-4" />
        </div>
        <h3 className="font-bold text-slate-900">Build Network</h3>
      </div>
      <ul className="mt-4 space-y-3">
        {people.map((p) => (
          <li key={p.name} className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-linear-to-br from-slate-200 to-slate-300 text-slate-700 text-xs font-bold">
              {p.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-900 truncate">{p.name}</div>
              <div className="text-xs text-slate-500 truncate">{p.role}</div>
            </div>
            <button
              onClick={() => toast(`Friend request sent to ${p.name}`)}
              className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-blue-600 hover:bg-blue-50 transition"
              aria-label={`Add ${p.name}`}
            >
              <UserPlus className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
      <button className="mt-4 w-full rounded-xl border border-slate-200 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
        View All Suggestions
      </button>
    </div>
  );
}

function InfluenceCard() {
  return (
    <div className="rounded-3xl bg-linear-to-br from-fuchsia-600 to-fuchsia-800 p-6 text-white shadow-lg shadow-fuchsia-500/20">
      <div className="text-xs font-semibold uppercase tracking-wider text-fuchsia-200">
        Your Civic Influence
      </div>
      <div className="mt-2 text-5xl font-black">Top 5%</div>
      <p className="mt-3 text-sm text-fuchsia-100 leading-relaxed">
        Your posts have inspired{" "}
        <span className="font-bold text-white">14 neighbours</span> across Bengaluru to take action this month.
      </p>
    </div>
  );
}