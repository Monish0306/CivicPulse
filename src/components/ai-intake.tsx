import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import {
  Camera, Mic, MicOff, Sparkles, MapPin, Pencil,
  CheckCircle2, Wand2, Image as ImageIcon,
  Upload, ChevronRight, Navigation,
  LocateFixed, AlertCircle, Square,
} from "lucide-react";
import type { GeminiResult } from "@/lib/gemini";

// ── Web Speech API type shim ──────────────────────────────
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
  interface SpeechRecognition extends EventTarget {
    continuous:          boolean;
    interimResults:      boolean;
    lang:                string;
    start():             void;
    stop():              void;
    onresult:            ((e: SpeechRecognitionEvent) => void) | null;
    onerror:             ((e: SpeechRecognitionErrorEvent) => void) | null;
    onend:               (() => void) | null;
  }
  interface SpeechRecognitionEvent extends Event {
    readonly results: SpeechRecognitionResultList;
  }
  interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
  }
  interface SpeechRecognitionResult {
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
    readonly isFinal: boolean;
  }
  interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
  }
  interface SpeechRecognitionErrorEvent extends Event {
    readonly error: SpeechRecognitionErrorCode;
  }
}

type Stage     = "upload" | "scanning" | "result";
type InputMode = "photo" | "voice";

type LocationInfo = {
  source:    "gps" | "manual";
  label:     string;
  area?:     string;
  street?:   string;
  landmark?: string;
  pincode?:  string;
  lat?:      number;
  lng?:      number;
};

// ── Root component ────────────────────────────────────────
export function AIIntake() {
  const [stage,        setStage]        = useState<Stage>("upload");
  const [inputMode,    setInputMode]    = useState<InputMode>("photo");
  const [photoUrl,     setPhotoUrl]     = useState<string | null>(null);
  const [photoFile,    setPhotoFile]    = useState<File | null>(null);
  const [location,     setLocation]     = useState<LocationInfo | null>(null);
  const [geminiResult, setGeminiResult] = useState<GeminiResult | null>(null);
  const [publishing,   setPublishing]   = useState(false);
  const [voiceText,    setVoiceText]    = useState<string>("");
  const navigate = useNavigate();

  // ── base64 helper ───────────────────────────────────────
  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function analyzeVoiceTranscript(transcript: string): Promise<GeminiResult> {
    const { analyzeVoiceTranscript: analyzeVoice } = await import("@/lib/gemini");
    return analyzeVoice(transcript);
  }

  // ── Analyze via IMAGE ───────────────────────────────────
  const startWithPhoto = async (info: LocationInfo) => {
    if (!photoFile) {
      toast.error("Please upload a photo first");
      return;
    }
    setLocation(info);
    setStage("scanning");
    try {
      const { analyzeIssueImage } = await import("@/lib/gemini");
      const base64 = await fileToBase64(photoFile);
      const result = await analyzeIssueImage(base64, photoFile.type || "image/jpeg");
      if (!result.isValidIssue) {
        toast.error(
          result.rejectionReason || "This doesn't appear to be a civic issue.",
          { description: "Please upload a clear photo of a public infrastructure problem.", duration: 5000 }
        );
        setStage("upload");
        return;
      }
      setGeminiResult(result);
      setStage("result");
    } catch (err) {
      console.error("Gemini image error:", err);
      toast.error("AI analysis failed. Please try again.");
      setStage("upload");
    }
  };

  // ── Analyze via VOICE transcript ────────────────────────
  const startWithVoice = async (transcript: string, info: LocationInfo) => {
    if (!transcript.trim()) {
      toast.error("No voice transcript found. Please speak clearly and try again.");
      return;
    }
    setVoiceText(transcript);
    setLocation(info);
    setStage("scanning");
    try {
      const result = await analyzeVoiceTranscript(transcript);
      if (!result.isValidIssue) {
        toast.error(
          result.rejectionReason || "This doesn't seem to describe a civic issue.",
          { description: "Please describe a specific public infrastructure problem.", duration: 5000 }
        );
        setStage("upload");
        return;
      }
      setGeminiResult(result);
      setStage("result");
    } catch (err) {
      console.error("Gemini voice error:", err);
      toast.error("Voice analysis failed. Please try again.");
      setStage("upload");
    }
  };

  // ── Publish to Firestore ────────────────────────────────
  const publish = async () => {
    if (!geminiResult || !location) return;
    setPublishing(true);
    try {
      const { auth }             = await import("@/lib/firebase");
      const { createIssue }      = await import("@/lib/firestore");
      const { uploadIssueImage } = await import("@/lib/storage");
      const user = auth.currentUser;
      if (!user) {
        toast.error("Please sign in to publish a report.");
        setPublishing(false);
        return;
      }
      const issueId = `issue_${Date.now()}`;
      let imageUrl  = "";
      if (photoFile) {
        imageUrl = await uploadIssueImage(photoFile, issueId);
      }
      await createIssue({
        reportedBy:      user.uid,
        reporterName:    user.displayName || "Anonymous",
        category:        geminiResult.category,
        severity:        geminiResult.severity,
        dangerLevel:     geminiResult.dangerLevel,
        department:      geminiResult.department,
        aiDescription:   geminiResult.aiDescription,
        confidence:      geminiResult.confidence,
        butterflyEffect: geminiResult.butterflyEffect,
        imageUrl,
        location: {
          lat:     location.lat ?? 12.9716,
          lng:     location.lng ?? 77.5946,
          address: location.label,
          zone:    location.area || location.street || "Unknown Zone",
        },
        status:  "reported",
        upvotes: 0,
      });
      toast.success("Issue published! It's now live on the map.");
      reset();
      navigate({ to: "/" });
    } catch (err) {
      console.error("Publish error:", err);
      toast.error("Failed to publish. Please try again.");
    } finally {
      setPublishing(false);
    }
  };

  const reset = () => {
    setStage("upload");
    setPhotoUrl(null);
    setPhotoFile(null);
    setLocation(null);
    setGeminiResult(null);
    setVoiceText("");
    setInputMode("photo");
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-slate-50">
      <div className="absolute inset-0 bg-grid-slate pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-purple-50/60 via-blue-50/30 to-transparent pointer-events-none" />

      <div className="relative mx-auto max-w-5xl px-6 sm:px-10 py-12 sm:py-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3.5 py-1 text-xs font-bold text-purple-700">
            <Sparkles className="h-3.5 w-3.5" />
            Gemini 2.0 Flash · Live Analysis
          </span>
          <h1 className="mt-4 text-4xl sm:text-5xl font-black tracking-tight text-slate-900">
            Zero-Friction Reporting
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-500 leading-relaxed">
            Snap a photo or speak your issue — Gemini AI extracts category,
            severity, and urgency automatically.
          </p>
          <StageDots stage={stage} />
        </div>

        <div className="mt-12">
          {stage === "upload" && (
            <UploadZone
              inputMode={inputMode}
              setInputMode={setInputMode}
              onTriggerPhoto={startWithPhoto}
              onTriggerVoice={startWithVoice}
              photoUrl={photoUrl}
              setPhotoUrl={setPhotoUrl}
              setPhotoFile={setPhotoFile}
            />
          )}
          {stage === "scanning" && (
            <ScanningZone mode={inputMode} />
          )}
          {stage === "result" && geminiResult && (
            <ResultZone
              onReset={reset}
              onPublish={publish}
              publishing={publishing}
              photoUrl={photoUrl}
              voiceText={voiceText}
              location={location}
              result={geminiResult}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Stage dots ────────────────────────────────────────────
function StageDots({ stage }: { stage: Stage }) {
  const idx    = stage === "upload" ? 0 : stage === "scanning" ? 1 : 2;
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

// ── Upload zone (photo + voice tabs) ─────────────────────
function UploadZone({
  inputMode, setInputMode,
  onTriggerPhoto, onTriggerVoice,
  photoUrl, setPhotoUrl, setPhotoFile,
}: {
  inputMode:       InputMode;
  setInputMode:    (m: InputMode) => void;
  onTriggerPhoto:  (info: LocationInfo) => void;
  onTriggerVoice:  (transcript: string, info: LocationInfo) => void;
  photoUrl:        string | null;
  setPhotoUrl:     (u: string | null) => void;
  setPhotoFile:    (f: File | null) => void;
}) {
  const fileRef     = useRef<HTMLInputElement>(null);
  const recognizerRef = useRef<SpeechRecognition | null>(null);

  const [gpsState,       setGpsState]       = useState<"idle"|"locating"|"ok"|"fail">("idle");
  const [gpsCoords,      setGpsCoords]      = useState<{lat:number;lng:number;label:string}|null>(null);
  const [showManual,     setShowManual]      = useState(false);
  const [manual,         setManual]          = useState({ area:"", street:"", landmark:"", pincode:"" });
  const [currentFile,    setCurrentFile]     = useState<File | null>(null);

  // Voice states
  const [isRecording,    setIsRecording]     = useState(false);
  const [transcript,     setTranscript]      = useState("");
  const [interimText,    setInterimText]     = useState("");
  const [voiceSupported, setVoiceSupported]  = useState(true);

  useEffect(() => {
    const supported = "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
    setVoiceSupported(supported);
  }, []);

  // ── Start recording ─────────────────────────────────────
  const startRecording = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      toast.error("Voice recording not supported in this browser. Please use Chrome.");
      return;
    }

    const recognition = new SR();
    recognition.continuous     = true;
    recognition.interimResults = true;
    recognition.lang           = "en-IN"; // Indian English

    let finalTranscript = "";

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = e.results.length - 1; i >= 0; i--) {
        if (e.results[i].isFinal) {
          finalTranscript += e.results[i][0].transcript + " ";
        } else {
          interim = e.results[i][0].transcript;
        }
      }
      setTranscript(finalTranscript.trim());
      setInterimText(interim);
    };

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", e.error);
      if (e.error === "not-allowed") {
        toast.error("Microphone access denied. Please allow microphone permissions.");
      } else if (e.error === "no-speech") {
        toast.error("No speech detected. Please speak clearly.");
      } else {
        toast.error(`Voice error: ${e.error}`);
      }
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
      setInterimText("");
    };

    recognizerRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    setTranscript("");
    setInterimText("");
    toast.success("Listening… speak your issue clearly", { duration: 2000 });
  };

  // ── Stop recording ──────────────────────────────────────
  const stopRecording = () => {
    recognizerRef.current?.stop();
    setIsRecording(false);
    setInterimText("");
  };

  const onFile = (f: File | null) => {
    if (!f) return;
    setCurrentFile(f);
    setPhotoFile(f);
    setPhotoUrl(URL.createObjectURL(f));
    toast.success("Photo loaded", { description: f.name });
  };

  const fetchGPS = () => {
    setGpsState("locating");
    if (!("geolocation" in navigator)) {
      setGpsState("fail"); setShowManual(true);
      toast.error("GPS unavailable — enter location manually");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const lat = p.coords.latitude, lng = p.coords.longitude;
        const label = `${lat.toFixed(4)}°N · ${lng.toFixed(4)}°E`;
        setGpsCoords({ lat, lng, label });
        setGpsState("ok");
        toast.success("GPS locked", { description: label });
      },
      () => { setGpsState("fail"); setShowManual(true); toast.error("GPS failed — enter manually"); },
      { timeout: 6000 }
    );
  };

  const buildLocation = (): LocationInfo | null => {
    if (gpsState === "ok" && gpsCoords) {
      return { source: "gps", label: gpsCoords.label, lat: gpsCoords.lat, lng: gpsCoords.lng, area: "GPS Location" };
    }
    if (!manual.area && !manual.street && !manual.landmark) return null;
    const label = [manual.street, manual.area, manual.pincode].filter(Boolean).join(", ");
    return { source: "manual", label: label || manual.landmark || "Manual location", ...manual, lat: 12.9716, lng: 77.5946 };
  };

  const submitPhoto = () => {
    if (!currentFile) { toast.error("Please add a photo first"); return; }
    const loc = buildLocation();
    if (!loc) { toast.error("Please provide a location (GPS or manual)"); setShowManual(true); return; }
    onTriggerPhoto(loc);
  };

  const submitVoice = () => {
    if (!transcript.trim()) { toast.error("Please record your voice first"); return; }
    const loc = buildLocation();
    if (!loc) { toast.error("Please provide a location (GPS or manual)"); setShowManual(true); return; }
    onTriggerVoice(transcript, loc);
  };

  return (
    <div className="space-y-6">
      {/* Mode tabs */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-2xl bg-slate-100 p-1.5 gap-1">
          <button
            onClick={() => setInputMode("photo")}
            className={"flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all " +
              (inputMode === "photo" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}
          >
            <Camera className="h-4 w-4" /> Photo Report
          </button>
          <button
            onClick={() => setInputMode("voice")}
            className={"flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all " +
              (inputMode === "voice" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}
          >
            <Mic className="h-4 w-4" /> Voice Report
          </button>
        </div>
      </div>

      {/* Photo mode */}
      {inputMode === "photo" && (
        <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-white p-8 transition-all hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/10">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/30">
            <Camera className="h-6 w-6 text-white" strokeWidth={2.4} />
          </div>
          <h3 className="mt-5 text-xl font-bold text-slate-900">Visual Intake</h3>
          <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
            Upload or snap a photo of the civic issue. Gemini Vision will analyze it instantly.
          </p>
          <div className="mt-5 flex items-center gap-2 text-[11px] font-medium text-slate-400">
            <ImageIcon className="h-3.5 w-3.5" /> JPG · PNG · HEIC · up to 25MB
          </div>
          <input
            ref={fileRef} type="file" accept="image/*" capture="environment"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
          {photoUrl && (
            <img src={photoUrl} alt="Preview" className="mt-5 h-44 w-full rounded-2xl object-cover ring-1 ring-slate-200" />
          )}
          <div className="mt-6 flex items-center gap-3">
            <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-slate-800 transition">
              <Camera className="h-4 w-4" />
              {photoUrl ? "Replace photo" : "Open Camera"}
            </button>
            <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition">
              <Upload className="h-4 w-4" /> Upload file
            </button>
          </div>
        </div>
      )}

      {/* Voice mode */}
      {inputMode === "voice" && (
        <div className="rounded-3xl border-2 border-slate-200 bg-white p-8">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 shadow-lg shadow-purple-500/30">
            <Mic className="h-6 w-6 text-white" strokeWidth={2.4} />
          </div>
          <h3 className="mt-5 text-xl font-bold text-slate-900">Voice Intake</h3>
          <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
            Describe the issue in your own words. Speak in English or Hindi. Gemini will extract all details from your description.
          </p>

          {!voiceSupported && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-sm font-medium text-amber-800">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Voice recording requires Chrome or Edge browser. Please switch browsers.
            </div>
          )}

          {voiceSupported && (
            <>
              {/* Record button */}
              <div className="mt-6 flex items-center gap-4">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-purple-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 hover:shadow-xl transition"
                  >
                    <Mic className="h-4 w-4" />
                    Start Recording
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="inline-flex items-center gap-2 rounded-full bg-red-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-500/30 hover:bg-red-600 transition animate-pulse"
                  >
                    <Square className="h-4 w-4" />
                    Stop Recording
                  </button>
                )}
                {isRecording && (
                  <div className="flex items-center gap-2 text-sm text-red-600 font-semibold">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                    </span>
                    Recording…
                  </div>
                )}
              </div>

              {/* Live transcript display */}
              {(transcript || interimText) && (
                <div className="mt-5 rounded-2xl border border-purple-200 bg-purple-50/60 p-4">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-purple-600 mb-2">
                    Live Transcript
                  </div>
                  <p className="text-sm text-slate-800 leading-relaxed">
                    {transcript}
                    {interimText && (
                      <span className="text-slate-400 italic"> {interimText}</span>
                    )}
                  </p>
                </div>
              )}

              {/* Tips */}
              <div className="mt-5 rounded-xl bg-slate-50 border border-slate-200 p-4">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Tips for best results
                </div>
                <ul className="space-y-1 text-xs text-slate-500">
                  <li>· Say the type of issue: "There is a large pothole on 100 Ft Road"</li>
                  <li>· Mention severity: "It is very deep and dangerous for vehicles"</li>
                  <li>· Give location context: "Near Indiranagar metro station exit"</li>
                  <li>· Describe condition: "The road is completely broken and flooded"</li>
                </ul>
              </div>

              {transcript && !isRecording && (
                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => { setTranscript(""); setInterimText(""); }}
                    className="text-sm text-slate-500 hover:text-slate-700 underline"
                  >
                    Clear transcript
                  </button>
                  <span className="text-slate-300">·</span>
                  <span className="text-xs text-slate-400">{transcript.split(" ").length} words recorded</span>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Location block — shared for both modes */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-600" /> Location of the Issue
            </h3>
            <p className="mt-1 text-sm text-slate-500">GPS is automatic. Or enter the area manually.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={fetchGPS} className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3.5 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition">
              <LocateFixed className="h-4 w-4" />
              {gpsState === "locating" ? "Locating…" : gpsState === "ok" ? "GPS Locked ✓" : "Use GPS"}
            </button>
            <button onClick={() => setShowManual((s) => !s)} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
              <Navigation className="h-4 w-4" /> Enter Manually
            </button>
          </div>
        </div>

        {gpsState === "ok" && gpsCoords && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            {gpsCoords.label}
          </div>
        )}
        {gpsState === "fail" && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
            <AlertCircle className="h-4 w-4" /> GPS unavailable. Please enter location manually.
          </div>
        )}

        {showManual && (
          <div className="mt-5 grid sm:grid-cols-2 gap-3">
            <Field label="Area / Locality" value={manual.area} onChange={(v) => setManual({...manual, area:v})} placeholder="e.g. Indiranagar, Koramangala" />
            <Field label="Street / Road"   value={manual.street} onChange={(v) => setManual({...manual, street:v})} placeholder="e.g. 100 Ft Road" />
            <Field label="Landmark"        value={manual.landmark} onChange={(v) => setManual({...manual, landmark:v})} placeholder="e.g. Near Sony Signal" />
            <Field label="PIN Code"        value={manual.pincode} onChange={(v) => setManual({...manual, pincode:v})} placeholder="e.g. 560038" />
          </div>
        )}

        {/* Submit button — changes based on mode */}
        <div className="mt-6 flex justify-end">
          {inputMode === "photo" ? (
            <button
              onClick={submitPhoto}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:shadow-xl transition"
            >
              <Sparkles className="h-4 w-4" />
              Run AI Analysis
            </button>
          ) : (
            <button
              onClick={submitVoice}
              disabled={!transcript.trim() || isRecording}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-purple-700 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 hover:shadow-xl transition disabled:opacity-40"
            >
              <Sparkles className="h-4 w-4" />
              Analyze Voice Report
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Field ─────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder }: { label:string; value:string; onChange:(v:string)=>void; placeholder?:string }) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition" />
    </label>
  );
}

// ── Scanning zone ─────────────────────────────────────────
function ScanningZone({ mode }: { mode: InputMode }) {
  const labels = mode === "voice"
    ? ["Transcript", "Classify", "Severity", "Route"]
    : ["Vision", "Classify", "Severity", "Route"];

  return (
    <div className="mx-auto max-w-xl">
      <div className="relative overflow-hidden rounded-3xl bg-white p-12 shadow-xl ring-1 ring-slate-200/70">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-full overflow-hidden">
          <div className="animate-scanner-sweep absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-purple-400/60 to-transparent blur-sm" />
          <div className="animate-scanner-sweep absolute inset-x-0 h-0.5 bg-purple-500 shadow-[0_0_18px_rgba(168,85,247,0.9)]" />
        </div>
        <div className="relative flex flex-col items-center text-center">
          <div className="relative">
            <div className="absolute inset-0 -m-4 rounded-full bg-purple-200/60 blur-2xl" />
            <div className="relative grid h-24 w-24 place-items-center rounded-3xl bg-gradient-to-br from-purple-500 to-purple-700 shadow-2xl shadow-purple-500/40">
              {mode === "voice"
                ? <Mic className="h-12 w-12 text-white animate-pulse" strokeWidth={2.2} />
                : <Sparkles className="h-12 w-12 text-white animate-sparkle-spin" strokeWidth={2.2} />
              }
            </div>
          </div>
          <h2 className="mt-7 text-2xl font-black tracking-tight text-slate-900">
            {mode === "voice" ? "Gemini is analyzing your voice report…" : "Gemini is analyzing your photo…"}
          </h2>
          <p className="mt-2 text-sm text-slate-500 max-w-sm">
            {mode === "voice"
              ? "Reading transcript, classifying issue type, estimating severity, and routing to the right department."
              : "Classifying category, estimating severity, routing to department, and predicting downstream impact."
            }
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold">
            {labels.map((t, i) => (
              <span key={t} className="rounded-full bg-purple-50 px-2.5 py-1 text-purple-700 animate-pulse" style={{ animationDelay: `${i * 200}ms` }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Result zone ───────────────────────────────────────────
function ResultZone({
  onReset, onPublish, publishing, photoUrl, voiceText, location, result,
}: {
  onReset:    () => void;
  onPublish:  () => void;
  publishing: boolean;
  photoUrl:   string | null;
  voiceText:  string;
  location:   LocationInfo | null;
  result:     GeminiResult;
}) {
  const locLabel = location?.label ?? "Location not set";
  const sc =
    result.severity === "critical"
      ? { bg:"bg-red-50",     ring:"ring-red-100",     text:"text-red-600",     badge:"bg-red-100 text-red-700"     }
      : result.severity === "medium"
      ? { bg:"bg-amber-50",   ring:"ring-amber-100",   text:"text-amber-600",   badge:"bg-amber-100 text-amber-700"   }
      : { bg:"bg-emerald-50", ring:"ring-emerald-100", text:"text-emerald-600", badge:"bg-emerald-100 text-emerald-700" };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-200/70">
        {/* Header */}
        <div className="relative bg-slate-900 px-6 py-4 text-white">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-slate-900 to-slate-900 pointer-events-none" />
          <div className="relative flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-purple-500 to-purple-700">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </span>
              <span className="text-sm font-semibold">Analyzed by Gemini 2.0 Flash</span>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-mono text-white/70">
                {Math.round(result.confidence * 100)}% confidence
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-mono text-slate-200">
              <MapPin className="h-3 w-3 text-emerald-400" />
              {locLabel.length > 35 ? locLabel.slice(0, 35) + "…" : locLabel}
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          {/* Photo preview */}
          {photoUrl && (
            <img src={photoUrl} alt="Reported issue" className="mb-6 h-48 w-full rounded-2xl object-cover ring-1 ring-slate-200" />
          )}

          {/* Voice transcript preview */}
          {voiceText && !photoUrl && (
            <div className="mb-6 rounded-2xl bg-purple-50 border border-purple-200 p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-purple-600 mb-1.5 flex items-center gap-1.5">
                <Mic className="h-3 w-3" /> Voice Report Transcript
              </div>
              <p className="text-sm text-slate-700 leading-relaxed italic">"{voiceText}"</p>
            </div>
          )}

          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ${sc.badge}`}>
                  {result.category.replace(/_/g, " ")}
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
                  {result.department}
                </span>
                {result.urgencyFlag && (
                  <span className="rounded-full bg-red-500 px-2.5 py-0.5 text-[11px] font-bold text-white">⚡ URGENT</span>
                )}
              </div>
              <h2 className="mt-3 text-xl sm:text-2xl font-black tracking-tight text-slate-900 leading-tight capitalize">
                {result.aiDescription}
              </h2>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                Detected at <span className="font-semibold text-slate-700">{locLabel}</span>. Routed to <span className="font-semibold text-slate-700">{result.department}</span> for resolution.
              </p>
              {/* Condition + age tags */}
              <div className="mt-3 flex flex-wrap gap-2">
                {result.condition && (
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    result.condition === "hazardous" ? "bg-red-100 text-red-700" :
                    result.condition === "dirty"     ? "bg-amber-100 text-amber-700" :
                    result.condition === "damaged"   ? "bg-orange-100 text-orange-700" :
                    result.condition === "neglected" ? "bg-purple-100 text-purple-700" :
                    "bg-slate-100 text-slate-600"}`}>
                    ● {result.condition.charAt(0).toUpperCase() + result.condition.slice(1)}
                  </span>
                )}
                {result.estimatedAge && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
                    🕐 {result.estimatedAge}
                  </span>
                )}
              </div>
            </div>

            {/* Danger score */}
            <div className={`shrink-0 grid h-20 w-20 sm:h-24 sm:w-24 place-items-center rounded-2xl ${sc.bg} ring-1 ${sc.ring} text-center`}>
              <div>
                <div className={`text-2xl sm:text-3xl font-black ${sc.text} leading-none`}>
                  {result.dangerLevel}<span className="text-base opacity-60">/10</span>
                </div>
                <div className={`mt-1 text-[10px] font-bold uppercase tracking-wider ${sc.text}`}>Urgency</div>
              </div>
            </div>
          </div>

          {/* Severity bar */}
          <div className="mt-5">
            <div className="flex justify-between text-[11px] font-semibold text-slate-500 mb-1.5">
              <span>Severity</span>
              <span className="capitalize">{result.severity}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${
                result.severity === "critical" ? "w-full bg-red-500" :
                result.severity === "medium"   ? "w-2/3 bg-amber-500" :
                                                  "w-1/3 bg-emerald-500"}`} />
            </div>
          </div>

          {/* Butterfly Effect */}
          <div className="mt-6 rounded-2xl border-l-4 border-purple-500 bg-gradient-to-br from-purple-50 via-purple-50/60 to-white p-5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-700">
              <Wand2 className="h-3.5 w-3.5" /> The Butterfly Effect Predictor
            </div>
            <p className="mt-2 text-sm text-slate-700 leading-relaxed">{result.butterflyEffect}</p>
          </div>

          {/* Buttons */}
          <div className="mt-7 flex flex-wrap items-center justify-end gap-3">
            <button onClick={onReset} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition">
              <Pencil className="h-4 w-4" /> Edit
            </button>
            <button onClick={onPublish} disabled={publishing} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:shadow-xl transition disabled:opacity-60">
              <CheckCircle2 className="h-4 w-4" />
              {publishing ? "Publishing…" : "Confirm & Publish"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}