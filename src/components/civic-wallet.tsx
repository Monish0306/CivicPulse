import { useState } from "react";
import { toast } from "sonner";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Gift,
  QrCode,
  CreditCard,
  Sparkles,
  Send,
  Plus,
  ShieldCheck,
  Coins,
  Ticket,
} from "lucide-react";

type Tx = {
  id: string;
  title: string;
  detail: string;
  amount: number; // positive credit, negative debit
  time: string;
  kind: "reward" | "redeem" | "topup" | "send";
};

const INITIAL_TX: Tx[] = [
  { id: "T1", title: "Reward · Resolved pothole report", detail: "BBMP credited via UPI", amount: 250, time: "Today · 10:24 AM", kind: "reward" },
  { id: "T2", title: "Redeemed · BMTC Bus Pass", detail: "Monthly student pass", amount: -150, time: "Yesterday · 06:12 PM", kind: "redeem" },
  { id: "T3", title: "Reward · Verified 3 neighbour reports", detail: "Civic Points → ₹ conversion", amount: 90, time: "2 Sep · 02:40 PM", kind: "reward" },
  { id: "T4", title: "Sent to Priya Sharma", detail: "UPI · priya@okhdfc", amount: -200, time: "1 Sep · 11:00 AM", kind: "send" },
  { id: "T5", title: "Top-up from HDFC ••4521", detail: "UPI auto-recharge", amount: 1000, time: "30 Aug · 09:18 AM", kind: "topup" },
];

const REWARDS = [
  { id: "r1", title: "₹50 BMTC Voucher", cost: 100, tag: "Transit" },
  { id: "r2", title: "Cubbon Park Plant Sapling", cost: 60, tag: "Eco" },
  { id: "r3", title: "₹100 BigBasket Voucher", cost: 220, tag: "Groceries" },
  { id: "r4", title: "Metro Smart Card Top-up ₹150", cost: 300, tag: "Transit" },
];

export function CivicWallet() {
  const [balance, setBalance] = useState(3250);
  const [points, setPoints] = useState(840);
  const [tx, setTx] = useState<Tx[]>(INITIAL_TX);
  const [sendOpen, setSendOpen] = useState(false);

  const addTx = (t: Omit<Tx, "id" | "time">) => {
    setTx((prev) => [
      { ...t, id: "T" + Math.random().toString(36).slice(2, 7), time: "Just now" },
      ...prev,
    ]);
  };

  const topUp = (amt: number) => {
    setBalance((b) => b + amt);
    addTx({ title: `Top-up ₹${amt}`, detail: "UPI · HDFC ••4521", amount: amt, kind: "topup" });
    toast.success(`Wallet topped up with ₹${amt}`);
  };

  const redeem = (r: (typeof REWARDS)[number]) => {
    if (points < r.cost) {
      toast.error("Not enough Civic Points", { description: `Need ${r.cost - points} more.` });
      return;
    }
    setPoints((p) => p - r.cost);
    addTx({ title: `Redeemed · ${r.title}`, detail: `${r.cost} Civic Points used`, amount: 0, kind: "redeem" });
    toast.success(`Redeemed: ${r.title}`, { description: "Voucher sent to your inbox." });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
            Civic Wallet
          </h1>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
            <ShieldCheck className="h-3.5 w-3.5" /> UPI Verified
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => topUp(500)}
            className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Plus className="h-4 w-4" /> Add Money
          </button>
          <button
            onClick={() => setSendOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Send className="h-4 w-4" /> Send
          </button>
        </div>
      </header>

      {/* Balance card */}
      <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-emerald-600 via-emerald-700 to-teal-800 p-6 sm:p-8 text-white shadow-xl shadow-emerald-900/30">
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="relative grid sm:grid-cols-2 gap-6 items-end">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-200 flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5" /> Wallet Balance
            </div>
            <div className="mt-2 text-5xl font-black tabular-nums">₹{balance.toLocaleString("en-IN")}</div>
            <div className="mt-2 text-sm text-emerald-100">
              <span className="font-mono">UPI ID: aarav@civicsnap</span>
            </div>
          </div>
          <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-emerald-100 flex items-center gap-1.5">
                <Coins className="h-4 w-4 text-amber-300" /> Civic Points
              </span>
              <span className="font-mono text-amber-200 font-bold">{points} pts</span>
            </div>
            <div className="mt-3 h-2.5 rounded-full bg-white/15 overflow-hidden">
              <div className="h-full rounded-full bg-linear-to-r from-amber-400 to-amber-600" style={{ width: `${Math.min(100, (points / 1500) * 100)}%` }} />
            </div>
            <div className="mt-2 text-xs text-emerald-100">{1500 - points > 0 ? `${1500 - points} pts to Gold tier` : "Gold tier reached!"}</div>
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <ActionTile icon={QrCode} label="Scan & Pay" tone="indigo" onClick={() => toast("Scan a UPI QR to pay", { description: "Camera permission required." })} />
        <ActionTile icon={Send} label="Send Money" tone="blue" onClick={() => setSendOpen(true)} />
        <ActionTile icon={CreditCard} label="Pay Bills" tone="rose" onClick={() => toast.success("BESCOM electricity bill paid · ₹1,240")} />
        <ActionTile icon={Gift} label="Refer & Earn" tone="amber" onClick={() => toast("Referral link copied!", { description: "civicsnap.app/r/aarav" })} />
      </section>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        {/* Transactions */}
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">Recent Transactions</h2>
            <span className="text-xs text-slate-500">Last 30 days</span>
          </div>
          <ul className="divide-y divide-slate-100">
            {tx.map((t) => (
              <li key={t.id} className="flex items-center gap-4 px-6 py-4">
                <div className={"grid h-10 w-10 place-items-center rounded-2xl " + toneFor(t.kind)}>
                  {t.amount >= 0 ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 truncate">{t.title}</div>
                  <div className="text-xs text-slate-500 truncate">{t.detail} · {t.time}</div>
                </div>
                <div className={"font-mono font-bold " + (t.amount > 0 ? "text-emerald-600" : t.amount < 0 ? "text-slate-800" : "text-slate-400")}>
                  {t.amount === 0 ? "—" : (t.amount > 0 ? "+" : "−") + "₹" + Math.abs(t.amount)}
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Rewards */}
        <section className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-amber-100 text-amber-700">
              <Ticket className="h-4 w-4" />
            </div>
            <h3 className="font-bold text-slate-900">Redeem Civic Points</h3>
          </div>
          <ul className="space-y-3">
            {REWARDS.map((r) => (
              <li key={r.id} className="rounded-2xl border border-slate-200 p-3 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-linear-to-br from-amber-400 to-amber-600 text-white">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-900 truncate">{r.title}</div>
                  <div className="text-[11px] text-slate-500">{r.tag} · {r.cost} pts</div>
                </div>
                <button
                  onClick={() => redeem(r)}
                  disabled={points < r.cost}
                  className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  Redeem
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {sendOpen && <SendModal balance={balance} onClose={() => setSendOpen(false)} onSend={(name, amt) => {
        if (amt > balance) { toast.error("Insufficient balance"); return; }
        setBalance((b) => b - amt);
        addTx({ title: `Sent to ${name}`, detail: "UPI transfer", amount: -amt, kind: "send" });
        toast.success(`₹${amt} sent to ${name}`);
        setSendOpen(false);
      }} />}
    </div>
  );
}

function toneFor(kind: Tx["kind"]) {
  switch (kind) {
    case "reward": return "bg-emerald-100 text-emerald-700";
    case "topup": return "bg-blue-100 text-blue-700";
    case "redeem": return "bg-amber-100 text-amber-700";
    case "send": return "bg-rose-100 text-rose-700";
  }
}

function ActionTile({ icon: Icon, label, tone, onClick }: { icon: typeof Wallet; label: string; tone: "indigo" | "blue" | "rose" | "amber"; onClick: () => void }) {
  const toneMap = {
    indigo: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
    blue: "bg-blue-50 text-blue-700 hover:bg-blue-100",
    rose: "bg-rose-50 text-rose-700 hover:bg-rose-100",
    amber: "bg-amber-50 text-amber-700 hover:bg-amber-100",
  };
  return (
    <button onClick={onClick} className={"flex flex-col items-start gap-3 rounded-2xl p-4 transition " + toneMap[tone]}>
      <Icon className="h-5 w-5" />
      <span className="text-sm font-bold">{label}</span>
    </button>
  );
}

function SendModal({ balance, onClose, onSend }: { balance: number; onClose: () => void; onSend: (name: string, amount: number) => void }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-slate-900">Send Money via UPI</h3>
        <p className="mt-1 text-xs text-slate-500">Available: ₹{balance.toLocaleString("en-IN")}</p>
        <label className="block mt-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">UPI ID / Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. priya@okhdfc"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100" />
        </label>
        <label className="block mt-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Amount (₹)</span>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="500"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100" />
        </label>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
          <button
            onClick={() => {
              const amt = Number(amount);
              if (!name.trim() || !amt || amt <= 0) { toast.error("Enter a valid recipient and amount"); return; }
              onSend(name.trim(), amt);
            }}
            className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-700"
          >Send</button>
        </div>
      </div>
    </div>
  );
}