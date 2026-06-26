import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  Camera,
  Mic,
  Sparkles,
  MapPin,
  Pencil,
  CheckCircle2,
  Wand2,
  Image as ImageIcon,
  Upload,
  ChevronRight,
  Navigation,
  LocateFixed,
  AlertCircle,
} from "lucide-react";

type Stage = "upload" | "scanning" | "result";

type LocationInfo = {
  source: "gps" | "manual";
  label: string; // shown on result
  area?: string;
  street?: string;
  landmark?: string;
  pincode?: string;
  coords?: string;
};

export function AIIntake() {
  const [stage, setStage] = useState<Stage>("upload");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationInfo | null>(null);

  const start = (info: LocationInfo) => {
    setLocation(info);
    setStage("scanning");
    setTimeout(() => setStage("result"), 2600);
  };

  const reset = () => {
    setStage("upload");
    setPhotoUrl(null);
    setLocation(null);
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-slate-50">
      <div className="absolute inset-0 bg-grid-slate pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-80 bg-linear-to-b from-purple-50/60 via-blue-50/30 to-transparent pointer-events-none" />

      <div className="relative mx-auto max-w-5xl px-6 sm:px-10 py-12 sm:py-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3.5 py-1 text-xs font-bold text-purple-700">
            <Sparkles className="h-3.5 w-3.5" />
            Gemini 1.5 Pro Intake
          </span>
          <h1 className="mt-4 text-4xl sm:text-5xl font-black tracking-tight text-slate-900">
            Zero-Friction Reporting
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-500 leading-relaxed">
            Snap a photo or record a voice note, and our AI extracts location, category,
            and urgency automatically.
          </p>

          <StageDots stage={stage} />
        </div>

        {/* Stages */}
        <div className="mt-12">
          {stage === "upload" && (
            <UploadZone onTrigger={start} photoUrl={photoUrl} setPhotoUrl={setPhotoUrl} />
          )}
          {stage === "scanning" && <ScanningZone />}
          {stage === "result" && (
            <ResultZone onReset={reset} photoUrl={photoUrl} location={location} />
          )}
        </div>
      </div>
    </div>
  );
}

function StageDots({ stage }: { stage: Stage }) {
  const idx = stage === "upload" ? 0 : stage === "scanning" ? 1 : 2;
  const labels = ["Capture", "Analyze", "Publish"];
  return (
    <div className="mt-8 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500">
      {labels.map((l, i) => (
        <div key={l} className="flex items-center gap-2">
          <span className={"flex items-center gap-1.5 rounded-full px-3 py-1 transition-colors " + (i <= idx ? "bg-slate-900 text-white" : "bg-slate-200/80 text-slate-500")}>
            <span className={"h-1.5 w-1.5 rounded-full " + (i <= idx ? "bg-white" : "bg-slate-400")} />
            {l}
          </span>
          {i < labels.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-slate-300" />}
        </div>
      ))}
    </div>
  );
}

function UploadZone({
  onTrigger,
  photoUrl,
  setPhotoUrl,
}: {
  onTrigger: (info: LocationInfo) => void;
  photoUrl: string | null;
  setPhotoUrl: (u: string | null) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [gpsState, setGpsState] = useState<"idle" | "locating" | "ok" | "fail">("idle");
  const [coords, setCoords] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [manual, setManual] = useState({ area: "", street: "", landmark: "", pincode: "" });

  const onFile = (f: File | null) => {
    if (!f) return;
    setPhotoUrl(URL.createObjectURL(f));
    toast.success("Photo loaded", { description: f.name });
  };

  const fetchGPS = () => {
    setGpsState("locating");
    if (!("geolocation" in navigator)) {
      setGpsState("fail");
      setShowManual(true);
      toast.error("GPS unavailable — please enter location manually");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const c = `${p.coords.latitude.toFixed(4)}°N · ${p.coords.longitude.toFixed(4)}°E`;
        setCoords(c);
        setGpsState("ok");
        toast.success("GPS locked", { description: c });
      },
      () => {
        setGpsState("fail");
        setShowManual(true);
        toast.error("Couldn't fetch GPS", { description: "Enter the location details below." });
      },
      { timeout: 6000 }
    );
  };

  const submit = () => {
    if (!photoUrl && !showManual) {
      toast.error("Please add a photo or describe location first");
      return;
    }
    if (gpsState === "ok" && coords) {
      onTrigger({ source: "gps", label: coords, coords });
      return;
    }
    // Manual
    if (!manual.area && !manual.street && !manual.landmark) {
      toast.error("Please enter area, street or landmark");
      setShowManual(true);
      return;
    }
    const label = [manual.street, manual.area, manual.pincode].filter(Boolean).join(", ");
    onTrigger({
      source: "manual",
      label: label || manual.landmark || "Manual location",
      ...manual,
    });
  };

  return (
    <div className="space-y-6">
    <div className="grid gap-6 md:grid-cols-2">
      {/* Visual Intake */}
      <div className="group relative rounded-3xl border-2 border-dashed border-slate-300 bg-white p-8 transition-all hover:-translate-y-1 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/10">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-linear-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/30">
          <Camera className="h-6 w-6 text-white" strokeWidth={2.4} />
        </div>
        <h3 className="mt-5 text-xl font-bold text-slate-900">Visual Intake</h3>
        <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
          Upload or snap a photo. GPS is auto-extracted from EXIF metadata.
        </p>

        <div className="mt-5 flex items-center gap-2 text-[11px] font-medium text-slate-400">
          <ImageIcon className="h-3.5 w-3.5" /> JPG · PNG · HEIC · up to 25MB
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
        {photoUrl && (
          <img src={photoUrl} alt="Preview" className="mt-5 h-40 w-full rounded-2xl object-cover ring-1 ring-slate-200" />
        )}
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-slate-800 transition"
          >
            <Camera className="h-4 w-4" />
            {photoUrl ? "Replace photo" : "Open Camera"}
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
          >
            <Upload className="h-4 w-4" /> Upload file
          </button>
        </div>
      </div>

      {/* Acoustic Intake */}
      <div className="group relative rounded-3xl border-2 border-dashed border-slate-300 bg-white p-8 transition-all hover:-translate-y-1 hover:border-purple-400 hover:shadow-xl hover:shadow-purple-500/10">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-linear-to-br from-purple-500 to-purple-700 shadow-lg shadow-purple-500/30">
          <Mic className="h-6 w-6 text-white" strokeWidth={2.4} />
        </div>
        <h3 className="mt-5 text-xl font-bold text-slate-900">Acoustic Intake</h3>
        <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
          Driving or visually impaired? Just speak your problem — we'll transcribe and classify.
        </p>

        <div className="mt-5 flex items-center gap-2 text-[11px] font-medium text-slate-400">
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
          Hands-free · 12 languages · on-device privacy
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={() => toast("Listening… speak now", { description: "Release to transcribe." })}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:border-purple-400 hover:text-purple-700 transition"
          >
            <Mic className="h-4 w-4" />
            Hold to Speak
          </button>
        </div>
      </div>
    </div>

    {/* Location block */}
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-600" /> Location of the Issue
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            We try GPS first. If it fails, enter the area, street and landmark manually.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchGPS}
            className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3.5 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition"
          >
            <LocateFixed className="h-4 w-4" />
            {gpsState === "locating" ? "Locating…" : gpsState === "ok" ? "GPS Locked" : "Use GPS"}
          </button>
          <button
            onClick={() => setShowManual((s) => !s)}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <Navigation className="h-4 w-4" />
            Enter Manually
          </button>
        </div>
      </div>

      {gpsState === "ok" && coords && (
        <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          {coords}
        </div>
      )}
      {gpsState === "fail" && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
          <AlertCircle className="h-4 w-4" /> GPS unavailable. Please enter the location manually.
        </div>
      )}

      {showManual && (
        <div className="mt-5 grid sm:grid-cols-2 gap-3">
          <Field label="Area / Locality" value={manual.area} onChange={(v) => setManual({ ...manual, area: v })} placeholder="e.g. Indiranagar, Koramangala" />
          <Field label="Street / Road" value={manual.street} onChange={(v) => setManual({ ...manual, street: v })} placeholder="e.g. 100 Ft Road" />
          <Field label="Landmark" value={manual.landmark} onChange={(v) => setManual({ ...manual, landmark: v })} placeholder="e.g. Opposite Sony Signal" />
          <Field label="PIN Code" value={manual.pincode} onChange={(v) => setManual({ ...manual, pincode: v })} placeholder="e.g. 560038" />
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          onClick={submit}
          className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-blue-500 to-blue-700 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:shadow-xl transition"
        >
          <Sparkles className="h-4 w-4" />
          Run AI Analysis
        </button>
      </div>
    </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition"
      />
    </label>
  );
}

function ScanningZone() {
  return (
    <div className="mx-auto max-w-xl">
      <div className="relative overflow-hidden rounded-3xl bg-white p-12 shadow-xl ring-1 ring-slate-200/70">
        {/* Scanner laser */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-full overflow-hidden">
          <div className="animate-scanner-sweep absolute inset-x-0 h-24 bg-linear-to-b from-transparent via-purple-400/60 to-transparent blur-sm" />
          <div className="animate-scanner-sweep absolute inset-x-0 h-0.5 bg-purple-500 shadow-[0_0_18px_rgba(168,85,247,0.9)]" />
        </div>

        <div className="relative flex flex-col items-center text-center">
          <div className="relative">
            <div className="absolute inset-0 -m-4 rounded-full bg-purple-200/60 blur-2xl" />
            <div className="relative grid h-24 w-24 place-items-center rounded-3xl bg-linear-to-br from-purple-500 to-purple-700 shadow-2xl shadow-purple-500/40">
              <Sparkles className="h-12 w-12 text-white animate-sparkle-spin" strokeWidth={2.2} />
            </div>
          </div>

          <h2 className="mt-7 text-2xl font-black tracking-tight text-slate-900">
            Gemini is structuring data…
          </h2>
          <p className="mt-2 text-sm text-slate-500 max-w-sm">
            Extracting GPS, classifying category, estimating urgency, and predicting downstream impact.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold">
            {["Vision", "Geo", "Taxonomy", "Forecast"].map((t, i) => (
              <span
                key={t}
                className="rounded-full bg-purple-50 px-2.5 py-1 text-purple-700 animate-pulse"
                style={{ animationDelay: `${i * 200}ms` }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultZone({ onReset, photoUrl, location }: { onReset: () => void; photoUrl: string | null; location: LocationInfo | null }) {
  const locLabel = location?.label ?? "12.9719°N · 77.6412°E";
  return (
    <div className="mx-auto max-w-2xl">
      <div className="overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-200/70">
        {/* Header */}
        <div className="relative bg-slate-900 px-6 py-4 text-white">
          <div className="absolute inset-0 bg-linear-to-br from-purple-900/40 via-slate-900 to-slate-900 pointer-events-none" />
          <div className="relative flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-linear-to-br from-purple-500 to-purple-700">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </span>
              <span className="text-sm font-semibold">Auto-Generated by Gemini</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-mono text-slate-200">
              <MapPin className="h-3 w-3 text-emerald-400" />
              {locLabel}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8">
          {photoUrl && (
            <img src={photoUrl} alt="Reported issue" className="mb-6 h-48 w-full rounded-2xl object-cover ring-1 ring-slate-200" />
          )}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-bold text-red-700">
                  Infrastructure
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
                  BBMP · Public Works
                </span>
              </div>
              <h2 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-slate-900 leading-tight">
                Severe Asphalt Degradation
              </h2>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                Multi-point cracking with ~35 cm pothole, exposed rebar near east curb.
                Detected on <span className="font-semibold text-slate-700">{locLabel}</span>.
              </p>
            </div>

            <div className="shrink-0 grid h-20 w-20 sm:h-24 sm:w-24 place-items-center rounded-2xl bg-red-50 ring-1 ring-red-100 text-center">
              <div>
                <div className="text-2xl sm:text-3xl font-black text-red-600 leading-none">8<span className="text-base text-red-400">/10</span></div>
                <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-red-500">Urgency</div>
              </div>
            </div>
          </div>

          {/* Butterfly Effect */}
          <div className="mt-6 rounded-2xl border-l-4 border-purple-500 bg-linear-to-br from-purple-50 via-purple-50/60 to-white p-5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-700">
              <Wand2 className="h-3.5 w-3.5" />
              The Butterfly Effect Predictor
            </div>
            <p className="mt-2 text-sm text-slate-700 leading-relaxed">
              If ignored, this pothole will cause significant vehicle tire damage,
              triggering a 22% spike in two-wheeler skids on this corridor —
              <span className="font-semibold text-slate-900"> leading to gridlock within 14 days</span>
              and an estimated <span className="font-semibold text-purple-700">₹4.8L</span> in cascading repair costs.
            </p>
          </div>

          {/* Buttons */}
          <div className="mt-7 flex flex-wrap items-center justify-end gap-3">
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </button>
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1.5 rounded-full bg-linear-to-r from-blue-500 to-blue-700 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition"
            >
              <CheckCircle2 className="h-4 w-4" />
              Confirm &amp; Publish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}