"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Shield,
  Layers,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Building2,
  TrendingUp,
  FileText,
  Compass,
  Cpu,
  Database,
  BarChart3,
  Map,
  Menu,
  X,
  Play,
  ChevronRight,
  Droplets,
} from "lucide-react";

/* ------------------------------------------------------------------
   MEDIA — swap these. A Pexels direct file URL works too, e.g.
   "https://videos.pexels.com/video-files/<id>/<file>.mp4"
   (open the clip on Pexels → Free Download → copy the mp4 link).
   Missing images fall back to an animated rain placeholder.
------------------------------------------------------------------- */
const HERO_VIDEO = "https://www.pexels.com/download/video/14109231/";
const HERO_POSTER = "https://images.pexels.com/photos/28447792/pexels-photo-28447792.jpeg";
const PHOTOS = {
  street: "https://images.pexels.com/photos/35302178/pexels-photo-35302178.jpeg",
  drainage: "https://upload.wikimedia.org/wikipedia/commons/7/74/Persevering_unfavorable_weather_conditions.jpg?utm_source=commons.wikimedia.org&utm_campaign=index&utm_content=original",
};

const navItems = [
  { label: "Overview", href: "#overview" },
  { label: "The Problem", href: "#problem" },
  { label: "Model", href: "#pipeline" },
  { label: "Results", href: "#results" },
  { label: "AI Layer", href: "#ai-layer" },
];

const stages = [
  {
    number: "01",
    label: "HAZARD",
    title: "Map where flooding can happen",
    description:
      "Five severity tiers turn the Nairobi flood proxy into a consistent starting point for scenario analysis.",
    icon: Activity,
    tone: "bg-[#EAF2F8] text-[#00264D]",
    items: ["Common · 5-Yr", "Occasional · 10-Yr", "Moderate · 25-Yr", "Severe · 50-Yr", "Extreme · 100-Yr"],
  },
  {
    number: "02",
    label: "VULNERABILITY",
    title: "Estimate physical damage",
    description:
      "Adapted depth-damage relationships translate flood severity into a damage ratio for different construction types.",
    icon: Shield,
    tone: "bg-[#FFF4E5] text-[#9A5B00]",
    items: ["Iron sheet", "Semi-permanent", "Permanent masonry", "Damage ceiling", "Documented assumptions"],
  },
  {
    number: "03",
    label: "EXPOSURE",
    title: "Know what is at risk",
    description:
      "A 600-property synthetic portfolio connects locations, construction characteristics and replacement values.",
    icon: Building2,
    tone: "bg-[#EAF7F0] text-[#087443]",
    items: ["600 properties", "KES 4.82B TIV", "Geocoded assets", "Construction class", "Spatial accumulation"],
  },
  {
    number: "04",
    label: "FINANCIAL ENGINE",
    title: "Turn damage into loss",
    description:
      "Property-level losses are aggregated across scenarios to produce portfolio loss and exceedance-probability outputs.",
    icon: BarChart3,
    tone: "bg-[#FCECEF] text-[#D21245]",
    items: ["Loss = TIV × damage", "AAL: KES 94.2M", "100-Yr PML: KES 842.6M", "EP curve", "Risk decisions"],
  },
];

const stakeholderCards = [
  ["Underwriters", "Defensible loss estimates and return periods for faster quote budgeting."],
  ["Portfolio managers", "See where insured value is concentrated before accumulation becomes a capital problem."],
  ["Cedants & brokers", "Create faster, more consistent flood-risk views for treaty conversations."],
  ["Disaster agencies", "Prioritise flood hotspots and drainage interventions from the same spatial view."],
  ["Judges", "Inspect the assumptions, synthetic labels and actual effect of the AI layer."],
];

const tickerItems = [
  "KES 4.82B insured value",
  "600 properties modeled",
  "5 flood severity tiers",
  "24 validated hotspots",
  "AAL KES 94.2M",
  "100-Yr PML KES 842.6M",
  "91.7% hotspot detection",
];

/* ---------- motion helpers ---------- */

function useInView<T extends HTMLElement>(threshold = 0.25) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, seen] as const;
}

function CountUp({
  to,
  decimals = 0,
  prefix = "",
  suffix = "",
  duration = 1600,
}: {
  to: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const [ref, seen] = useInView<HTMLSpanElement>(0.4);
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!seen) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVal(to);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setVal(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen, to, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {val.toFixed(decimals)}
      {suffix}
    </span>
  );
}

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const [ref, seen] = useInView<HTMLDivElement>(0.12);
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out motion-reduce:transition-none ${
        seen ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100"
      } ${className}`}
    >
      {children}
    </div>
  );
}

const globalCss = `
@keyframes kenburns { 0% { transform: scale(1.02); } 100% { transform: scale(1.1); } }
@keyframes rain { 0% { background-position: 0 0; } 100% { background-position: -60px 240px; } }
@keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
@keyframes drawline { to { stroke-dashoffset: 0; } }
@keyframes fadearea { to { opacity: 1; } }
@keyframes popdot { 0% { transform: scale(0); } 100% { transform: scale(1); } }
@keyframes ripple { 0% { transform: scale(0.6); opacity: 0.7; } 100% { transform: scale(2.6); opacity: 0; } }
@keyframes floaty { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
@keyframes drift { 0% { background-position: 0 0; } 100% { background-position: 44px 44px; } }
.anim-kenburns { animation: kenburns 24s ease-in-out infinite alternate; }
.anim-rain {
  background-image: repeating-linear-gradient(105deg, rgba(255,255,255,0.08) 0 1px, transparent 1px 28px);
  background-size: 60px 240px; animation: rain 1.6s linear infinite;
}
.anim-rain-light {
  background-image: repeating-linear-gradient(105deg, rgba(0,38,77,0.12) 0 1px, transparent 1px 22px);
  background-size: 60px 240px; animation: rain 1.8s linear infinite;
}
.anim-ticker { animation: ticker 32s linear infinite; }
.anim-ripple { animation: ripple 2.4s ease-out infinite; }
.anim-floaty { animation: floaty 5s ease-in-out infinite; }
.dots {
  background-image: radial-gradient(rgba(0,38,77,0.16) 1.2px, transparent 1.2px);
  background-size: 22px 22px; animation: drift 14s linear infinite;
}
.dots-fade {
  -webkit-mask-image: linear-gradient(to bottom, transparent, #000 22%, #000 78%, transparent);
  mask-image: linear-gradient(to bottom, transparent, #000 22%, #000 78%, transparent);
}
.ep-line { stroke-dasharray: 1; stroke-dashoffset: 1; }
.ep-line.on { animation: drawline 1.8s ease-out forwards; }
.ep-area { opacity: 0; }
.ep-area.on { animation: fadearea 1s ease-out 1.2s forwards; }
.ep-dot { transform: scale(0); transform-box: fill-box; transform-origin: center; }
.ep-dot.on { animation: popdot 0.4s ease-out forwards; }
@media (prefers-reduced-motion: reduce) {
  .anim-kenburns, .anim-rain, .anim-rain-light, .anim-ticker, .anim-ripple, .anim-floaty, .dots { animation: none; }
  .ep-line { stroke-dashoffset: 0; } .ep-area { opacity: 1; } .ep-dot { transform: scale(1); }
  .ep-line.on, .ep-area.on, .ep-dot.on { animation: none; }
}
`;

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <main className="min-h-screen overflow-x-hidden bg-white font-sans text-slate-900 selection:bg-[#D21245] selection:text-white">
      <style>{globalCss}</style>

      {/* NAVIGATION */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
  <div className="mx-auto flex h-36 max-w-[1440px] items-center justify-between px-4 sm:h-[72px] sm:px-8">
    <a href="#overview" className="group flex flex-col items-center gap-1">
      <img
        src="image.png"
        alt="Kenya Re"
        className="h-12 w-12 rounded-lg object-contain transition-transform duration-300 group-hover:scale-105 sm:h-14 sm:w-14"
      />
      <div className="text-[8px] font-bold tracking-[0.18em] text-slate-500 sm:text-[9px]">
        CAT RISK INTELLIGENCE
      </div>
    </a>

    <nav className="hidden items-center gap-1 lg:flex">
      {navItems.map((item) => (
        <a
          key={item.href}
          href={item.href}
          className="rounded-lg px-3.5 py-2 text-xs font-semibold text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-[#00264D]"
        >
          {item.label}
        </a>
      ))}
    </nav>

    <div className="flex items-center gap-2">
      <Link
        href="/dashboard"
        className="hidden items-center gap-2 rounded-lg bg-[#D21245] px-4 py-2.5 text-xs font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#B50F3B] hover:shadow-lg sm:inline-flex"
      >
        Open Dashboard
        <ArrowRight className="size-3.5" />
      </Link>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="inline-flex size-10 items-center justify-center rounded-lg border border-slate-200 text-[#00264D] lg:hidden"
        aria-label="Toggle navigation"
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>
    </div>
  </div>

  {mobileOpen && (
    <div className="max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-slate-200 bg-white px-4 py-3 lg:hidden">
      {navItems.map((item) => (
        <a
          key={item.href}
          href={item.href}
          onClick={() => setMobileOpen(false)}
          className="block border-b border-slate-100 py-3.5 text-sm font-semibold text-slate-700 last:border-0"
        >
          {item.label}
        </a>
      ))}
      <Link
        href="/dashboard"
        className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-[#D21245] px-4 py-3 text-sm font-bold text-white"
      >
        Open Dashboard <ArrowRight className="size-4" />
      </Link>
    </div>
  )}
</header>

      {/* HERO */}
      <section id="overview" className="relative overflow-hidden bg-[#1b3a57]">
        <div className="absolute inset-0 z-0">
          <video
            className="anim-kenburns h-full w-full object-cover"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            poster={HERO_POSTER}
          >
            <source src={HERO_VIDEO} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/35" />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="anim-rain absolute inset-0" aria-hidden />
        </div>
        <div className="absolute inset-y-0 left-0 z-10 w-1 bg-[#D21245] sm:w-[6px]" />

        <div className="relative z-10 mx-auto max-w-[1440px] px-4 pb-32 pt-14 sm:px-8 sm:pb-36 sm:pt-20 lg:min-h-[700px] lg:pt-24">
          <div className="grid w-full gap-10 lg:grid-cols-12 lg:items-end lg:gap-12">
            <div className="lg:col-span-8">
              <div className="mb-5 inline-flex items-center gap-2 border border-white/30 bg-white/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur-sm">
                <span className="size-2 animate-pulse rounded-full bg-[#D21245]" />
                AI4I Hackathon 2026 · Team A
              </div>

              <h1 className="max-w-4xl text-[2.5rem] font-black leading-[1.05] tracking-[-0.04em] text-white drop-shadow-lg sm:text-6xl lg:text-7xl">
                Making Nairobi&apos;s
                <span className="block text-[#FF5C86]">flood risk visible.</span>
              </h1>

              <p className="mt-5 max-w-2xl text-[15px] leading-7 text-white/90 drop-shadow sm:mt-6 sm:text-lg">
                An AI-assisted catastrophe model that connects flood hazard, vulnerability, exposure and financial
                loss—so an underwriter can see the risk behind the number.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
                <Link
                  href="/dashboard"
                  className="group inline-flex items-center justify-center gap-2 rounded-lg bg-[#D21245] px-5 py-3.5 text-xs font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#B50F3B] hover:shadow-xl sm:py-3"
                >
                  Open Dashboard
                  <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/40 bg-white/15 px-5 py-3.5 text-xs font-bold text-white backdrop-blur-sm transition-all duration-300 hover:bg-white hover:text-[#00264D] sm:py-3"
                >
                  <Play className="size-3.5 fill-current" />
                  Open Dashboard
                </Link>
              </div>

              <div className="mt-7 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] font-medium text-white/85 sm:mt-8 sm:gap-x-5">
                <span>
                  <CountUp to={600} /> synthetic properties
                </span>
                <span className="hidden sm:inline">•</span>
                <span>
                  <CountUp to={5} /> severity tiers
                </span>
                <span className="hidden sm:inline">•</span>
                <span>
                  <CountUp to={24} /> validated hotspots
                </span>
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="anim-floaty border border-white/25 bg-white/10 p-4 shadow-2xl backdrop-blur-md sm:p-5">
                <div className="flex items-center justify-between border-b border-white/20 pb-4">
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/80">
                    Portfolio snapshot
                  </span>
                  <span className="flex items-center gap-1.5 border border-emerald-300/40 bg-emerald-400/15 px-2 py-1 font-mono text-[9px] font-bold text-emerald-200">
                    <span className="size-1.5 animate-pulse rounded-full bg-emerald-300" />
                    MODEL READY
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4">
                  <Metric label="Total exposure" value={<CountUp to={4.82} decimals={2} prefix="KES " suffix="B" />} detail="600 assets" />
                  <Metric
                    label="100-Yr PML"
                    value={<CountUp to={842.6} decimals={1} prefix="KES " suffix="M" />}
                    detail="17.5% portfolio loss"
                    danger
                  />
                </div>

                <div className="mt-3 border border-white/15 bg-black/20 p-4">
                  <div className="flex justify-between text-[10px] font-bold uppercase text-white/70">
                    <span>Average annual loss</span>
                    <span className="font-mono text-white">
                      <CountUp to={94.2} decimals={1} prefix="KES " suffix="M" />
                    </span>
                  </div>
                  <GrowBar width={20} className="mt-3 h-1.5 bg-white/20" fill="bg-[#FF5C86]" />
                  <div className="mt-2 flex justify-between text-[9px] text-white/60">
                    <span>Technical risk premium</span>
                    <span>1.95% annual burn</span>
                  </div>
                </div>

                <div className="mt-3 border-l-2 border-[#FF5C86] bg-black/20 p-4">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#FF8FAC]">AI impact</div>
                  <div className="mt-1 font-mono text-xl font-black text-white">
                    <CountUp to={115} prefix="+KES " suffix="M" />
                  </div>
                  <p className="mt-1 text-[10px] leading-4 text-white/70">
                    Additional modeled capital exposure from drainage-gap detection.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <a
          href="#problem"
          className="absolute inset-x-0 bottom-14 z-10 flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-[0.15em] text-white/80 hover:text-white sm:bottom-20"
        >
          Scroll to understand <ChevronRight className="size-3 rotate-90" />
        </a>

        {/* wave divider into the white page */}
        <svg
          className="absolute -bottom-px left-0 z-10 block h-10 w-full sm:h-16"
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path d="M0 40 C 240 90, 480 0, 720 38 S 1200 78, 1440 30 L1440 80 L0 80 Z" fill="#ffffff" />
        </svg>
      </section>

      {/* TICKER */}
      <div className="overflow-hidden bg-white py-3" aria-hidden>
        <div className="anim-ticker flex w-max gap-10 whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.14em] text-[#00264D]">
          {[...tickerItems, ...tickerItems].map((t, i) => (
            <span key={i} className="flex items-center gap-10">
              {t}
              <Droplets className="size-3 text-[#D21245]" />
            </span>
          ))}
        </div>
      </div>

      {/* WHY IT MATTERS */}
      <Divider label="The problem" />
      <Section id="problem" tone="white">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-12">
          <Reveal className="lg:col-span-7">
            <Eyebrow>01 · The problem</Eyebrow>
            <h2 className="mt-3 max-w-3xl text-[1.75rem] font-black leading-tight tracking-tight text-[#00264D] sm:text-5xl">
              A city can flood faster than a portfolio can understand it.
            </h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              Nairobi&apos;s drainage system has not kept pace with urban growth. The challenge is not simply finding
              water—it is understanding how one event can affect hundreds of insured assets at the same time.
            </p>
          </Reveal>

          <Reveal delay={150} className="lg:col-span-5">
            <div className="grid grid-cols-2 gap-px overflow-hidden border border-slate-200 bg-slate-200 shadow-sm">
              <StatTile value={<CountUp to={37} />} label="Government-identified flood-prone neighbourhoods" />
              <StatTile value={<CountUp to={24} />} label="Named hotspots used in the supplied validation set" />
              <StatTile value={<CountUp to={12} suffix="/24" />} label="Hotspots flagged by the starter terrain proxy" />
              <StatTile value={<CountUp to={600} />} label="Synthetic buildings available for portfolio modeling" />
            </div>
          </Reveal>
        </div>

        <Reveal className="mt-10 sm:mt-14">
          <PhotoBand
            src={PHOTOS.street}
            alt="Flooded street in Nairobi"
            title="One storm. Hundreds of claims."
            chip={<><CountUp to={37} /> flood-prone neighbourhoods</>}
          />
        </Reveal>

        <div className="mt-8 grid gap-4 sm:gap-5 md:grid-cols-3">
          <Reveal>
            <ProblemCard
              icon={Layers}
              number="01"
              title="Accumulation is the hidden risk"
              text="One rainfall event can generate many claims at once. CAT modeling makes that concentration visible before it becomes a capital problem."
            />
          </Reveal>
          <Reveal delay={120}>
            <ProblemCard
              icon={AlertTriangle}
              number="02"
              title="Terrain alone misses drainage"
              text="The supplied proxy flags 12 of 24 validated hotspots. Drainage bottlenecks can create flood risk that elevation and distance-to-river signals cannot see."
            />
          </Reveal>
          <Reveal delay={240}>
            <ProblemCard
              icon={TrendingUp}
              number="03"
              title="Loss needs a probability"
              text="A single loss estimate is not enough. The EP curve shows how loss changes as flood severity becomes less frequent."
            />
          </Reveal>
        </div>
      </Section>

      {/* PIPELINE */}
      <Divider label="The model" />
      <Section id="pipeline" tone="soft">
        <Reveal className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div className="max-w-3xl">
            <Eyebrow>02 · The model</Eyebrow>
            <h2 className="mt-3 text-[1.75rem] font-black leading-tight tracking-tight text-[#00264D] sm:text-5xl">
              From physical flood signal to financial loss.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
              The model follows the standard catastrophe-modeling chain: hazard → vulnerability → exposure → financial
              engine.
            </p>
          </div>
          <div className="hidden border-l-2 border-[#D21245] pl-4 text-xs leading-5 text-slate-500 md:block">
            Built for a non-modeler to understand
            <br />
            in under two minutes.
          </div>
        </Reveal>

        <div className="mt-10 grid gap-4 sm:mt-12 md:grid-cols-2 lg:grid-cols-4">
          {stages.map((stage, i) => (
            <Reveal key={stage.number} delay={i * 120}>
              <StageCard stage={stage} />
            </Reveal>
          ))}
        </div>

        <div className="mt-8 grid gap-5 sm:mt-10 sm:gap-6 lg:grid-cols-12">
          <Reveal className="border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:col-span-7">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#D21245]">Loss profile</div>
                <h3 className="mt-1 text-lg font-black text-[#00264D] sm:text-xl">Exceedance probability</h3>
              </div>
              <span className="shrink-0 border border-slate-200 px-2 py-1 font-mono text-[9px] text-slate-500">
                SYNTHETIC OUTPUT
              </span>
            </div>
            <EPChart />
            <div className="mt-3 flex justify-between text-[9px] text-slate-400">
              <span>More frequent events</span>
              <span>Rarer / more severe events</span>
            </div>
          </Reveal>

          <Reveal
            delay={150}
            className="border border-l-4 border-slate-200 border-l-[#D21245] bg-white p-5 shadow-sm sm:p-6 lg:col-span-5"
          >
            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#D21245]">Model discipline</div>
            <h3 className="mt-2 text-xl font-black text-[#00264D]">Know what is real.</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              The interface clearly separates supplied real-world signals, synthetic exposure and assumptions. The
              hazard layer is a proxy, not measured flood depth.
            </p>
            <div className="mt-6 space-y-3">
              <LegendRow icon={CheckCircle2} label="Real terrain + river signals" tone="text-emerald-600" />
              <LegendRow icon={Database} label="Synthetic 600-property portfolio" tone="text-sky-600" />
              <LegendRow icon={FileText} label="Documented vulnerability assumptions" tone="text-amber-600" />
              <LegendRow icon={Cpu} label="AI modifies the modeled result" tone="text-[#D21245]" />
            </div>
          </Reveal>
        </div>
      </Section>

      {/* DATA STORY */}
      <Divider label="The results" />
      <Section id="results" tone="white">
        <Reveal className="max-w-3xl">
          <Eyebrow>03 · What the model sees</Eyebrow>
          <h2 className="mt-3 text-[1.75rem] font-black leading-tight tracking-tight text-[#00264D] sm:text-5xl">
            A portfolio view that starts with geography.
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
            The supplied challenge data contains 600 synthetic Nairobi buildings with hazard scores attached across
            five severity tiers.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-5 sm:mt-12 sm:gap-6 lg:grid-cols-12">
          <div className="relative min-h-[340px] overflow-hidden border border-slate-200 bg-[#E9EEF1] shadow-sm sm:min-h-[390px] lg:col-span-7">
            <div className="absolute inset-0 opacity-70">
              <div className="absolute left-[8%] top-[15%] h-24 w-24 rounded-full border-[14px] border-[#00264D]/10 sm:h-32 sm:w-32 sm:border-[18px]" />
              <div className="absolute left-[28%] top-[32%] h-40 w-40 rounded-full border-[22px] border-[#D21245]/10 sm:h-56 sm:w-56 sm:border-[30px]" />
              <div className="absolute right-[12%] top-[12%] h-32 w-32 rounded-full border-[18px] border-[#00264D]/10 sm:h-44 sm:w-44 sm:border-[24px]" />
              <div className="absolute bottom-[10%] left-[45%] h-20 w-20 rounded-full border-[12px] border-[#D21245]/15 sm:h-28 sm:w-28 sm:border-[16px]" />
              <div className="absolute bottom-[18%] right-[22%] h-16 w-16 rounded-full border-[8px] border-[#00264D]/10 sm:h-20 sm:w-20 sm:border-[10px]" />
            </div>
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)",
                backgroundSize: "48px 48px",
              }}
            />

            <Pin className="left-[19%] top-[28%]" />
            <Pin className="left-[48%] top-[48%]" big delay="0.6s" />
            <Pin className="right-[23%] top-[30%]" delay="1.2s" />
            <Pin className="bottom-[22%] right-[31%]" delay="1.8s" />

            <div className="absolute left-3 top-3 border border-slate-300 bg-white/95 px-3 py-2 shadow-sm sm:left-5 sm:top-5">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#00264D]">
                <Map className="size-3.5" /> Nairobi exposure view
              </div>
              <div className="mt-1 text-[9px] text-slate-500">Illustrative portfolio visualization</div>
            </div>

            <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2 sm:bottom-5 sm:left-5 sm:right-5">
              <MapPill label="Hotspot" color="bg-[#D21245]" />
              <MapPill label="Exposure cluster" color="bg-[#00264D]" />
              <MapPill label="Synthetic asset" color="bg-slate-400" />
            </div>
          </div>

          <div className="grid gap-4 lg:col-span-5">
            <Reveal className="border border-slate-200 bg-[#F6F7F8] p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-2">
                <Building2 className="size-4 text-[#D21245]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
                  Exposure by construction class
                </span>
              </div>
              <HorizontalBars />
            </Reveal>

            <Reveal delay={150} className="border border-[#D21245]/20 bg-[#FCECEF]/60 p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#D21245]">Decision numbers</div>
                <TrendingUp className="size-4 text-[#D21245]" />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-5">
                <MiniMetric value={<CountUp to={4.82} decimals={2} prefix="KES " suffix="B" />} label="Total insured value" />
                <MiniMetric value={<CountUp to={94.2} decimals={1} prefix="KES " suffix="M" />} label="Average annual loss" />
                <MiniMetric value={<CountUp to={842.6} decimals={1} prefix="KES " suffix="M" />} label="1-in-100 PML" />
                <MiniMetric value={<CountUp to={17.5} decimals={1} suffix="%" />} label="Portfolio loss at 100-Yr" />
              </div>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* AI */}
      <Divider label="The AI layer" />
      <Section id="ai-layer" tone="soft">
        <Reveal className="max-w-3xl">
          <Eyebrow>04 · AI layer</Eyebrow>
          <h2 className="mt-3 text-[1.75rem] font-black leading-tight tracking-tight text-[#00264D] sm:text-5xl">
            AI is part of the model—not decoration around it.
          </h2>
          <p className="mt-5 text-sm leading-7 text-slate-600 sm:text-base">
            The challenge requires AI to materially change an input or output. Our layer targets the part the terrain
            proxy cannot see: drainage-driven urban flooding, while also enabling natural-language exposure intake.
          </p>
        </Reveal>

        <Reveal className="mt-10 sm:mt-12">
          <PhotoBand
            src={PHOTOS.drainage}
            alt="Blocked urban drainage channel"
            title="What terrain alone cannot see."
            chip={<><CountUp to={115} prefix="+KES " suffix="M" /> modeled correction</>}
          />
        </Reveal>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <Reveal>
            <AICard
              number="01"
              label="GEOSPATIAL ML"
              title="Drainage-gap recalibration"
              metric={<CountUp to={91.7} decimals={1} suffix="%" />}
              metricLabel="hotspot detection accuracy"
              text="A gradient-boosted spatial model adds impervious-surface and drainage-capacity proxies to identify hotspots missed by terrain-only signals."
              footer="+KES 115M modeled solvency correction"
            />
          </Reveal>
          <Reveal delay={150}>
            <AICard
              number="02"
              label="NLP INTAKE"
              title="Natural-language policy ingestion"
              metric={<CountUp to={1.2} decimals={1} suffix="s" />}
              metricLabel="target processing time"
              text="An underwriter can describe a portfolio in plain language. The AI turns it into structured exposure data that can enter the same hazard, vulnerability and financial pipeline."
              footer="Structured exposure → live risk output"
            />
          </Reveal>
        </div>

        <div className="mt-8 flex flex-col justify-between gap-4 border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
            <p className="max-w-3xl text-xs leading-5 text-slate-700">
              The supplied hazard layer is a constructed susceptibility proxy, not measured flood depth. Synthetic
              exposure and assumptions are explicitly labeled in the model.
            </p>
          </div>
          <a href="#pipeline" className="shrink-0 text-xs font-bold text-[#00264D] hover:text-[#D21245]">
            Review methodology →
          </a>
        </div>
      </Section>

      {/* STAKEHOLDERS */}
      <Divider label="Built for decisions" />
      <Section tone="white">
        <Reveal className="text-center">
          <Eyebrow>05 · Built for decisions</Eyebrow>
          <h2 className="mt-3 text-[1.6rem] font-black leading-tight tracking-tight text-[#00264D] sm:text-4xl">
            One model. Five people who need different answers.
          </h2>
        </Reveal>

        <div className="mt-8 grid grid-cols-1 gap-3 sm:mt-10 sm:grid-cols-2 lg:grid-cols-5">
          {stakeholderCards.map(([title, text], index) => (
            <Reveal key={title} delay={index * 90}>
              <div className="group h-full border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#00264D] hover:shadow-lg">
                <div className="font-mono text-[10px] font-bold text-slate-400">0{index + 1}</div>
                <h3 className="mt-4 text-sm font-black text-[#00264D] sm:mt-5">{title}</h3>
                <p className="mt-2 text-[11px] leading-5 text-slate-500">{text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Divider label="Get started" />
      <Section tone="soft">
        <Reveal className="mx-auto max-w-[900px] text-center">
          <div className="anim-floaty mx-auto flex size-14 items-center justify-center rounded-xl bg-[#00264D] text-white shadow-lg">
            <Compass className="size-7 text-[#FF5C86]" />
          </div>
          <h2 className="mt-6 text-[1.75rem] font-black leading-tight tracking-tight text-[#00264D] sm:text-5xl">
            Stop looking at flood risk as a map.
            <span className="block">Look at it as a balance-sheet problem.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-slate-600">
            Open the interactive console to inspect the spatial risk view, portfolio accumulation, EP curve and
            AI-assisted underwriting flow.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/login"
              className="group inline-flex items-center justify-center gap-2 rounded-lg bg-[#D21245] px-5 py-3.5 text-xs font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#B50F3B] hover:shadow-lg sm:py-3"
            >
              Open Risk Console
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <a
              href="#overview"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3.5 text-xs font-bold text-[#00264D] transition-all duration-300 hover:bg-slate-50 sm:py-3"
            >
              Back to overview
            </a>
          </div>
        </Reveal>
      </Section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-7">
        <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-4 px-4 text-[10px] text-slate-500 sm:flex-row sm:px-8">
          <div>
            <span className="font-bold text-[#00264D]">Kenya Reinsurance Corporation</span>
            {" · "}AI4I Hackathon 2026 · Team A
          </div>
          <div className="flex gap-5">
            <a href="#pipeline" className="font-semibold hover:text-[#00264D]">
              Methodology
            </a>
            <Link href="/dashboard" className="font-semibold text-[#00264D] hover:text-[#D21245]">
              Live Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

/* ---------- layout pieces ---------- */

function Section({
  id,
  tone,
  children,
}: {
  id?: string;
  tone: "white" | "soft";
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={`relative scroll-mt-16 border-t border-slate-200 py-16 sm:py-24 ${
        tone === "white" ? "bg-white" : "bg-[#F6F7F8]"
      }`}
    >
      <div aria-hidden className="dots dots-fade pointer-events-none absolute inset-0" />
      <div className="relative mx-auto max-w-[1440px] px-4 sm:px-8">{children}</div>
    </section>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="relative z-20 h-0">
      <div className="absolute left-1/2 top-0 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#00264D] shadow-sm">
        <Droplets className="size-3.5 text-[#D21245]" />
        {label}
      </div>
    </div>
  );
}

function PhotoBand({
  src,
  alt,
  title,
  chip,
}: {
  src: string;
  alt: string;
  title: string;
  chip: React.ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="group relative h-56 overflow-hidden border border-slate-200 bg-gradient-to-br from-[#EAF2F8] to-[#FCECEF] shadow-sm sm:h-72 lg:h-80">
      {!failed ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1800ms] group-hover:scale-105"
        />
      ) : (
        <div className="anim-rain-light absolute inset-0" aria-hidden />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-8">
        <h3 className="max-w-md text-2xl font-black leading-tight text-white drop-shadow sm:text-4xl">{title}</h3>
        <span className="w-fit border border-white/40 bg-white/90 px-3 py-2 font-mono text-xs font-black text-[#00264D] backdrop-blur-sm">
          {chip}
        </span>
      </div>
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#D21245]">{children}</div>;
}

function GrowBar({ width, className, fill }: { width: number; className: string; fill: string }) {
  const [ref, seen] = useInView<HTMLDivElement>(0.5);
  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <div
        className={`h-full ${fill} transition-all duration-[1400ms] ease-out motion-reduce:transition-none`}
        style={{ width: seen ? `${width}%` : "0%" }}
      />
    </div>
  );
}

function Pin({ className, big = false, delay = "0s" }: { className: string; big?: boolean; delay?: string }) {
  return (
    <div className={`absolute ${className}`}>
      <span className="anim-ripple absolute -inset-1 rounded-full bg-[#D21245]/60" style={{ animationDelay: delay }} />
      <span
        className={`relative block rounded-full border-4 border-white bg-[#D21245] shadow-lg ${big ? "size-5" : "size-4"}`}
      />
    </div>
  );
}

function Metric({
  label,
  value,
  detail,
  danger = false,
}: {
  label: string;
  value: React.ReactNode;
  detail: string;
  danger?: boolean;
}) {
  return (
    <div className="border border-white/15 bg-black/20 p-3 sm:p-4">
      <div className="text-[9px] font-bold uppercase tracking-wider text-white/70">{label}</div>
      <div className={`mt-1 font-mono text-base font-black sm:text-lg ${danger ? "text-[#FF8FAC]" : "text-white"}`}>
        {value}
      </div>
      <div className="mt-1 text-[9px] text-white/60">{detail}</div>
    </div>
  );
}

function StatTile({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="bg-[#F6F7F8] p-4 transition-colors duration-300 hover:bg-white sm:p-5">
      <div className="font-mono text-2xl font-black text-[#00264D]">{value}</div>
      <div className="mt-1 text-[10px] leading-4 text-slate-500">{label}</div>
    </div>
  );
}

function ProblemCard({
  icon: Icon,
  number,
  title,
  text,
}: {
  icon: React.ElementType;
  number: string;
  title: string;
  text: string;
}) {
  return (
    <article className="group h-full border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#00264D] hover:shadow-lg sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex size-10 items-center justify-center bg-[#EAF2F8] text-[#00264D] transition-transform duration-300 group-hover:scale-105">
          <Icon className="size-5" />
        </div>
        <span className="font-mono text-[10px] font-bold text-slate-400">{number}</span>
      </div>
      <h3 className="mt-6 text-base font-black text-[#00264D]">{title}</h3>
      <p className="mt-2 text-xs leading-6 text-slate-600">{text}</p>
    </article>
  );
}

function StageCard({ stage }: { stage: (typeof stages)[number] }) {
  const Icon = stage.icon;
  return (
    <article className="group h-full border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#00264D] hover:shadow-lg">
      <div className="flex items-center justify-between">
        <div className={`flex size-9 items-center justify-center ${stage.tone}`}>
          <Icon className="size-4" />
        </div>
        <span className="font-mono text-[10px] font-bold text-slate-400">STAGE {stage.number}</span>
      </div>
      <div className="mt-5 text-[9px] font-bold tracking-[0.14em] text-slate-400">{stage.label}</div>
      <h3 className="mt-1 text-lg font-black text-[#00264D]">{stage.title}</h3>
      <p className="mt-3 text-xs leading-5 text-slate-500">{stage.description}</p>
      <ul className="mt-5 space-y-2 border-t border-slate-100 pt-4">
        {stage.items.map((item) => (
          <li key={item} className="flex items-center gap-2 text-[10px] font-medium text-slate-600">
            <span className="size-1.5 shrink-0 rounded-full bg-[#D21245]" />
            {item}
          </li>
        ))}
      </ul>
    </article>
  );
}

function EPChart() {
  const [ref, seen] = useInView<HTMLDivElement>(0.35);
  const points = [
    [40, 52],
    [100, 68],
    [160, 92],
    [220, 120],
    [280, 151],
    [340, 187],
    [400, 220],
    [460, 250],
  ];
  const path = points.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`).join(" ");
  const area = `${path} L 460 250 L 40 250 Z`;
  const on = seen ? "on" : "";

  return (
    <div ref={ref} className="mt-6">
      <svg viewBox="0 0 500 275" className="h-auto w-full" role="img" aria-label="Illustrative exceedance probability loss curve">
        <defs>
          <linearGradient id="epFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D21245" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#D21245" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="40" y1="20" x2="40" y2="250" stroke="#CBD5E1" strokeWidth="1" />
        <line x1="40" y1="250" x2="470" y2="250" stroke="#CBD5E1" strokeWidth="1" />
        {[75, 130, 185, 240].map((y) => (
          <line key={y} x1="40" y1={y} x2="470" y2={y} stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 5" />
        ))}
        <path d={area} fill="url(#epFill)" className={`ep-area ${on}`} />
        <path
          d={path}
          pathLength={1}
          fill="none"
          stroke="#D21245"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`ep-line ${on}`}
        />
        {points.map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="5"
            fill="white"
            stroke="#D21245"
            strokeWidth="3"
            className={`ep-dot ${on}`}
            style={{ animationDelay: `${0.2 + i * 0.22}s` }}
          />
        ))}
        <text x="43" y="17" fontSize="9" fill="#64748B">Higher loss</text>
        <text x="405" y="268" fontSize="9" fill="#64748B">Rarity →</text>
        <text x="5" y="246" fontSize="9" fill="#64748B">Low</text>
        <text x="5" y="25" fontSize="9" fill="#64748B">High</text>
      </svg>
    </div>
  );
}

function HorizontalBars() {
  const bars: [string, number][] = [
    ["Permanent masonry", 61],
    ["Semi-permanent", 25],
    ["Iron sheet", 14],
  ];
  return (
    <div className="mt-7 space-y-5">
      {bars.map(([label, width]) => (
        <div key={label}>
          <div className="mb-2 flex justify-between text-[10px] font-semibold text-slate-600">
            <span>{label}</span>
            <span>
              <CountUp to={width} suffix="%" />
            </span>
          </div>
          <GrowBar width={width} className="h-2 bg-slate-200" fill="bg-[#00264D]" />
        </div>
      ))}
      <p className="pt-1 text-[9px] leading-4 text-slate-400">
        Illustrative portfolio mix for interface presentation. Keep the underlying exposure file as the source of
        truth.
      </p>
    </div>
  );
}

function MiniMetric({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div>
      <div className="font-mono text-base font-black text-[#00264D] sm:text-lg">{value}</div>
      <div className="mt-1 max-w-[130px] text-[9px] leading-4 text-slate-500">{label}</div>
    </div>
  );
}

function LegendRow({
  icon: Icon,
  label,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  tone: string;
}) {
  return (
    <div className="flex items-center gap-3 border-t border-slate-200 pt-3">
      <Icon className={`size-3.5 shrink-0 ${tone}`} />
      <span className="text-[11px] text-slate-600">{label}</span>
    </div>
  );
}

function MapPill({ label, color }: { label: string; color: string }) {
  return (
    <span className="flex items-center gap-2 border border-white/50 bg-white/90 px-2.5 py-1.5 text-[9px] font-bold text-slate-700 shadow-sm">
      <span className={`size-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function AICard({
  number,
  label,
  title,
  metric,
  metricLabel,
  text,
  footer,
}: {
  number: string;
  label: string;
  title: string;
  metric: React.ReactNode;
  metricLabel: string;
  text: string;
  footer: string;
}) {
  return (
    <article className="group h-full border border-t-4 border-slate-200 border-t-[#D21245] bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-mono text-[9px] font-bold text-slate-400">FEATURE {number}</div>
          <div className="mt-2 inline-flex border border-[#D21245]/30 bg-[#FCECEF] px-2.5 py-1 text-[9px] font-bold tracking-[0.12em] text-[#D21245]">
            {label}
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-2xl font-black text-[#00264D]">{metric}</div>
          <div className="text-[8px] uppercase tracking-wider text-slate-500">{metricLabel}</div>
        </div>
      </div>
      <h3 className="mt-6 text-xl font-black text-[#00264D] sm:mt-7 sm:text-2xl">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
      <div className="mt-6 border-l-2 border-[#D21245] bg-[#F6F7F8] px-4 py-3 text-xs font-semibold text-slate-700 sm:mt-7">
        {footer}
      </div>
    </article>
  );
}