/// <reference types="google.maps" />
import { useEffect, useRef, useState } from "react";
import {
  MapPin,
  Clock,
  Flame,
  TrendingUp,
  Layers,
  Locate,
  Check,
  Map as MapIcon,
  Mountain,
  Satellite,
  Moon,
} from "lucide-react";

type Issue = {
  id: string;
  title: string;
  category: string;
  categoryTone: "amber" | "rose" | "sky" | "violet" | "emerald";
  time: string;
  location: string;
  status: "active" | "bounty" | "resolved";
  bounty?: string;
  lat: number;
  lng: number;
};

// Centered on Indiranagar, Bengaluru
const CENTER = { lat: 12.9719, lng: 77.6412 };

const ISSUES: Issue[] = [
  { id: "1", title: "Deep pothole at 100 Ft Road", category: "Road", categoryTone: "amber", time: "8 min ago", location: "100 Ft Rd, Indiranagar", status: "active", lat: 12.9719, lng: 77.6412 },
  { id: "2", title: "Broken bench in Cubbon Park", category: "Parks", categoryTone: "emerald", time: "22 min ago", location: "Cubbon Park, MG Road", status: "bounty", bounty: "₹250", lat: 12.9763, lng: 77.5929 },
  { id: "3", title: "Streetlight flickering near 5th Block", category: "Lighting", categoryTone: "violet", time: "1 hr ago", location: "80 Ft Rd, Koramangala", status: "active", lat: 12.9352, lng: 77.6245 },
  { id: "4", title: "Overflowing garbage bin near junction", category: "Sanitation", categoryTone: "rose", time: "2 hr ago", location: "BTM Layout 2nd Stage", status: "bounty", bounty: "₹150", lat: 12.9166, lng: 77.6101 },
  { id: "5", title: "Graffiti on Lalbagh boundary wall", category: "Vandalism", categoryTone: "sky", time: "3 hr ago", location: "Lalbagh West Gate", status: "active", lat: 12.9507, lng: 77.5848 },
  { id: "6", title: "Cracked footpath near St. Joseph's", category: "Road", categoryTone: "amber", time: "5 hr ago", location: "Vittal Mallya Rd", status: "active", lat: 12.9719, lng: 77.5959 },
  { id: "7", title: "Stop sign knocked down at Jayanagar", category: "Safety", categoryTone: "rose", time: "6 hr ago", location: "Jayanagar 4th Block", status: "resolved", lat: 12.9250, lng: 77.5938 },
  { id: "8", title: "Open manhole near HSR signal", category: "Safety", categoryTone: "rose", time: "9 hr ago", location: "HSR Layout Sector 1", status: "active", lat: 12.9116, lng: 77.6446 },
];

const TONE: Record<Issue["categoryTone"], string> = {
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  rose: "bg-rose-50 text-rose-700 ring-rose-100",
  sky: "bg-sky-50 text-sky-700 ring-sky-100",
  violet: "bg-violet-50 text-violet-700 ring-violet-100",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
};

const PIN_COLOR: Record<Issue["categoryTone"], string> = {
  amber: "#f59e0b",
  rose: "#f43f5e",
  sky: "#0ea5e9",
  violet: "#8b5cf6",
  emerald: "#10b981",
};

type Tab = "active" | "bounty" | "resolved";
type MapView = "roadmap" | "satellite" | "terrain" | "hybrid";

const MAP_VIEWS: { id: MapView; label: string; icon: typeof MapIcon }[] = [
  { id: "roadmap", label: "Default", icon: MapIcon },
  { id: "satellite", label: "Satellite", icon: Satellite },
  { id: "terrain", label: "Terrain", icon: Mountain },
  { id: "hybrid", label: "Hybrid", icon: Moon },
];

// Subtle, premium-looking light styles (only used on roadmap)
const LIGHT_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#f5f7fa" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#e2e8f0" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#cfe3f7" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#d8eccd" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];

let scriptLoading: Promise<void> | null = null;
function loadGoogleMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if ((window as unknown as { google?: { maps?: unknown } }).google?.maps) return Promise.resolve();
  if (scriptLoading) return scriptLoading;
  scriptLoading = new Promise<void>((resolve, reject) => {
    const w = window as unknown as Record<string, unknown>;
    w.__civicsnapInitMap = () => resolve();
    const key = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY;
    const channel = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID;
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&callback=__civicsnapInitMap&channel=${channel}`;
    s.async = true;
    s.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(s);
  });
  return scriptLoading;
}

export function LiveRadar() {
  const [tab, setTab] = useState<Tab>("active");
  const [view, setView] = useState<MapView>("roadmap");
  const [layersOpen, setLayersOpen] = useState(false);
  const filtered = ISSUES.filter((i) => i.status === tab);
  const current = MAP_VIEWS.find((v) => v.id === view)!;

  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const meMarkerRef = useRef<google.maps.Marker | null>(null);
  const vehiclesRef = useRef<google.maps.Marker[]>([]);
  const citizensRef = useRef<google.maps.Marker[]>([]);
  const [ready, setReady] = useState(false);
  const [nearby, setNearby] = useState({ vehicles: 0, citizens: 0 });

  // Init map
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then(() => {
        if (cancelled || !mapDivRef.current) return;
        const map = new google.maps.Map(mapDivRef.current, {
          center: CENTER,
          zoom: 15,
          mapTypeId: "roadmap",
          disableDefaultUI: true,
          gestureHandling: "greedy",
          clickableIcons: false,
          styles: LIGHT_STYLES,
        });
        mapRef.current = map;

        // Issue markers
        ISSUES.forEach((i) => {
          const marker = new google.maps.Marker({
            position: { lat: i.lat, lng: i.lng },
            map,
            title: i.title,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 9,
              fillColor: PIN_COLOR[i.categoryTone],
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 3,
            },
          });
          const info = new google.maps.InfoWindow({
            content: `<div style="font:600 13px system-ui;color:#0f172a;padding:2px 4px">${i.title}<div style="font-weight:500;color:#64748b;font-size:11px;margin-top:2px">${i.location} · ${i.time}</div></div>`,
          });
          marker.addListener("click", () => info.open({ map, anchor: marker }));
          markersRef.current.push(marker);
        });

        // "You are here" marker
        meMarkerRef.current = new google.maps.Marker({
          position: CENTER,
          map,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#2563eb",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 4,
          },
          zIndex: 999,
          title: "You are here · Aarav Sharma",
        });

        // Live BBMP vehicles (moving)
        const vehicleSeeds = [
          { lat: 12.9740, lng: 77.6380, label: "KA 01 MA 4521 · Sweeper" },
          { lat: 12.9700, lng: 77.6460, label: "KA 03 EQ 8821 · Pothole Crew" },
        ];
        vehiclesRef.current = vehicleSeeds.map((v) =>
          new google.maps.Marker({
            position: { lat: v.lat, lng: v.lng },
            map,
            title: v.label,
            icon: {
              url:
                "data:image/svg+xml;charset=UTF-8," +
                encodeURIComponent(
                  `<svg xmlns='http://www.w3.org/2000/svg' width='52' height='52' viewBox='0 0 52 52'>
                    <defs>
                      <filter id='s' x='-20%' y='-20%' width='140%' height='140%'>
                        <feDropShadow dx='0' dy='1.5' stdDeviation='1.5' flood-color='#000' flood-opacity='0.35'/>
                      </filter>
                    </defs>
                    <circle cx='26' cy='26' r='22' fill='#f59e0b' fill-opacity='0.18'/>
                    <circle cx='26' cy='26' r='15' fill='#ffffff' filter='url(#s)'/>
                    <g transform='translate(26 26)' fill='#f59e0b'>
                      <path d='M -8 -3 H 2 V 3 H -8 Z' />
                      <path d='M 2 -1 H 6 L 8 1 V 3 H 2 Z' />
                      <circle cx='-5' cy='4' r='1.8' fill='#0f172a'/>
                      <circle cx='5' cy='4' r='1.8' fill='#0f172a'/>
                    </g>
                  </svg>`,
                ),
              scaledSize: new google.maps.Size(52, 52),
              anchor: new google.maps.Point(26, 26),
            },
            label: {
              text: "🚛",
              fontSize: "0px",
              color: "transparent",
            },
            zIndex: 800,
          }),
        );

        // Nearby citizens on GPS
        const citizenSeeds = [
          { lat: 12.9735, lng: 77.6395, name: "Neha Verma" },
          { lat: 12.9708, lng: 77.6440, name: "Karthik Gowda" },
          { lat: 12.9750, lng: 77.6420, name: "Sneha Pillai" },
          { lat: 12.9695, lng: 77.6390, name: "Vikram Singh" },
          { lat: 12.9728, lng: 77.6452, name: "Anjali Menon" },
        ];
        citizensRef.current = citizenSeeds.map((c) =>
          new google.maps.Marker({
            position: { lat: c.lat, lng: c.lng },
            map,
            title: c.name + " · nearby",
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 5,
              fillColor: "#10b981",
              fillOpacity: 0.95,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            },
            zIndex: 600,
          }),
        );
        setNearby({ vehicles: vehicleSeeds.length, citizens: citizenSeeds.length });

        setReady(true);
      })
      .catch((e) => console.error(e));
    return () => {
      cancelled = true;
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      vehiclesRef.current.forEach((m) => m.setMap(null));
      vehiclesRef.current = [];
      citizensRef.current.forEach((m) => m.setMap(null));
      citizensRef.current = [];
      meMarkerRef.current?.setMap(null);
      mapRef.current = null;
    };
  }, []);

  // Animate vehicles around the neighbourhood (simulated GPS feed)
  useEffect(() => {
    if (!ready) return;
    let t = 0;
    const id = setInterval(() => {
      t += 1;
      vehiclesRef.current.forEach((m, idx) => {
        const phase = t / 20 + idx * Math.PI;
        const r = 0.004 + idx * 0.001;
        const pos = {
          lat: CENTER.lat + Math.sin(phase) * r,
          lng: CENTER.lng + Math.cos(phase) * r,
        };
        m.setPosition(pos);
      });
    }, 800);
    return () => clearInterval(id);
  }, [ready]);

  // Map type switch
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setMapTypeId(view);
    map.setOptions({ styles: view === "roadmap" ? LIGHT_STYLES : [] });
  }, [view, ready]);

  const zoomBy = (d: number) => {
    const map = mapRef.current;
    if (!map) return;
    map.setZoom((map.getZoom() ?? 15) + d);
  };
  const recenter = () => {
    const map = mapRef.current;
    if (!map) return;
    map.panTo(CENTER);
    map.setZoom(15);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col lg:flex-row">
      {/* Left: Feed */}
      <section className="w-full lg:w-[420px] shrink-0 bg-white border-r border-slate-200/80 flex flex-col">
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Neighborhood Feed</h1>
              <p className="text-sm text-slate-500 mt-0.5">Live signals within 2 km</p>
            </div>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-blue-50 text-blue-600">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>

          <div className="mt-5 inline-flex w-full rounded-full bg-slate-100 p-1 text-sm font-medium">
            {(["active", "bounty", "resolved"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={
                  "flex-1 capitalize rounded-full px-4 py-1.5 transition-all " +
                  (tab === t
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700")
                }
              >
                {t === "bounty" ? "Bounties" : t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {filtered.length === 0 && (
            <div className="text-center text-sm text-slate-400 py-12">No items in this view yet.</div>
          )}
          {filtered.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              onClick={() => {
                const map = mapRef.current;
                if (!map) return;
                map.panTo({ lat: issue.lat, lng: issue.lng });
                map.setZoom(17);
              }}
            />
          ))}
        </div>
      </section>

      {/* Right: Map */}
      <section className="relative flex-1 bg-slate-100 overflow-hidden">
        <div ref={mapDivRef} className="absolute inset-0" />
        {!ready && (
          <div className="absolute inset-0 grid place-items-center text-sm text-slate-400">
            Loading map…
          </div>
        )}

        {/* Top-left chips */}
        <div className="absolute top-5 left-5 flex items-center gap-2 z-10">
          <div className="flex items-center gap-2 rounded-full bg-white/85 backdrop-blur-xl px-3.5 py-2 shadow-sm ring-1 ring-slate-200/70">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-700">Live · Bengaluru</span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white/85 backdrop-blur-xl px-3.5 py-2 shadow-sm ring-1 ring-slate-200/70">
            <current.icon className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-xs font-semibold text-slate-700">{current.label} view</span>
          </div>
        </div>

        {/* Live GPS proximity card */}
        <div className="absolute bottom-6 left-6 z-10 rounded-2xl bg-white/85 backdrop-blur-xl shadow-xl ring-1 ring-slate-200/70 p-4 w-60">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Live GPS · 500m radius
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <div className="text-2xl font-bold text-amber-600 leading-none">{nearby.vehicles}</div>
              <div className="text-[11px] text-slate-500 mt-1">Crew vehicles nearby</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-600 leading-none">{nearby.citizens}</div>
              <div className="text-[11px] text-slate-500 mt-1">Citizens on GPS</div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-500">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-500" /> Sweeper
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 ml-2" /> Citizen
            <span className="inline-block h-2 w-2 rounded-full bg-blue-600 ml-2" /> You
          </div>
        </div>

        {/* Map controls */}
        <div className="absolute top-5 right-5 flex flex-col gap-2 z-10">
          <div className="relative">
            <button
              onClick={() => setLayersOpen((o) => !o)}
              className={
                "grid h-9 w-9 place-items-center rounded-full backdrop-blur-xl shadow-sm ring-1 transition " +
                (layersOpen
                  ? "bg-blue-600 text-white ring-blue-700"
                  : "bg-white/85 text-slate-600 ring-slate-200/70 hover:bg-white hover:text-slate-900")
              }
              aria-label="Map layers"
            >
              <Layers className="h-4 w-4" />
            </button>
            {layersOpen && (
              <div className="absolute right-0 top-11 w-48 rounded-2xl bg-white/95 backdrop-blur-xl shadow-xl ring-1 ring-slate-200/70 p-2 z-10">
                <div className="px-3 pt-1 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Map Type
                </div>
                {MAP_VIEWS.map((v) => {
                  const Icon = v.icon;
                  const active = v.id === view;
                  return (
                    <button
                      key={v.id}
                      onClick={() => { setView(v.id); setLayersOpen(false); }}
                      className={
                        "w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition " +
                        (active
                          ? "bg-blue-50 text-blue-700 font-semibold"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900")
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 text-left">{v.label}</span>
                      {active && <Check className="h-4 w-4 text-blue-600" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <button
            onClick={recenter}
            className="grid h-9 w-9 place-items-center rounded-full bg-white/85 backdrop-blur-xl text-slate-600 shadow-sm ring-1 ring-slate-200/70 hover:bg-white hover:text-blue-600 transition"
            aria-label="Recenter on my location"
            title="My location"
          >
            <Locate className="h-4 w-4" />
          </button>
          <div className="flex flex-col rounded-2xl bg-white/85 backdrop-blur-xl shadow-sm ring-1 ring-slate-200/70 overflow-hidden">
            <button
              onClick={() => zoomBy(1)}
              className="grid h-9 w-9 place-items-center text-slate-600 hover:bg-slate-50 text-xl leading-none"
              aria-label="Zoom in"
            >
              +
            </button>
            <div className="h-px bg-slate-200" />
            <button
              onClick={() => zoomBy(-1)}
              className="grid h-9 w-9 place-items-center text-slate-600 hover:bg-slate-50 text-xl leading-none"
              aria-label="Zoom out"
            >
              −
            </button>
          </div>
        </div>

        {/* Stats card */}
        <div className="absolute bottom-6 right-6 z-10 rounded-3xl bg-white/85 backdrop-blur-xl shadow-xl ring-1 ring-slate-200/70 p-5 w-64">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <Flame className="h-3.5 w-3.5 text-blue-600" />
            <span>Now</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <div>
              <div className="text-3xl font-bold text-slate-900 leading-none">24</div>
              <div className="text-[11px] font-medium text-slate-500 mt-1">Open Issues</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-emerald-600 leading-none">3</div>
              <div className="text-[11px] font-medium text-slate-500 mt-1">Active Crews</div>
            </div>
          </div>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-2/3 rounded-full bg-linear-to-r from-blue-500 to-blue-700" />
          </div>
          <p className="mt-2 text-[11px] text-slate-500">67% resolved this week</p>
        </div>
      </section>
    </div>
  );
}

function IssueCard({ issue, onClick }: { issue: Issue; onClick: () => void }) {
  const ref = useRef<HTMLElement>(null);
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(800px) rotateX(${-y * 6}deg) rotateY(${x * 8}deg) translateY(-3px)`;
  };
  const onLeave = () => {
    if (ref.current) ref.current.style.transform = "";
  };
  return (
    <article
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={onClick}
      style={{ transition: "transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease" }}
      className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-200 cursor-pointer will-change-transform"
    >
      <div className="flex items-center justify-between gap-2">
        <span className={"inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 " + TONE[issue.categoryTone]}>
          {issue.category}
        </span>
        {issue.bounty && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm shadow-emerald-500/30">
            {issue.bounty} bounty
          </span>
        )}
      </div>
      <h3 className="mt-3 text-[15px] font-semibold text-slate-900 leading-snug group-hover:text-blue-700 transition-colors">
        {issue.title}
      </h3>
      <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" />
          {issue.location}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {issue.time}
        </span>
      </div>
    </article>
  );
}