"use client";

/**
 * Landing "How Rapport works" section: the four product pillars (60-second
 * Echo, math verified in code, the review queue, zero client-facing AI).
 *
 * @module components/landing/features-section
 */
import { useEffect, useRef, useState } from "react";

const pillars = [
  {
    number: "02",
    title: "Math verified in code, never by AI",
    description:
      "The model only extracts what you said — it never does arithmetic. Every figure is recomputed and checked in plain TypeScript, so an overspend can never slip through.",
    stat: { value: "0", label: "numbers the AI makes up — it only repeats what you said" },
  },
  {
    number: "03",
    title: "A confidence-tiered review queue",
    description:
      "High-confidence updates commit automatically. Anything uncertain waits in Staging as a clean before/after diff for your sign-off — nothing changes without proof.",
    stat: { value: "≥90%", label: "auto-commit threshold" },
  },
  {
    number: "04",
    title: "Zero client-facing AI",
    description:
      "The AI never speaks to your clients. It works silently in the back office; the relationship — and every final decision — stays entirely yours.",
    stat: { value: "0", label: "messages the AI sends to your clients — ever" },
  },
];

// Floating dot particles visualization
function ParticleVisualization() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      };
    };
    canvas.addEventListener("mousemove", handleMouseMove);

    // Generate stable particle positions
    const COUNT = 70;
    const particles = Array.from({ length: COUNT }, (_, i) => {
      const seed = i * 1.618;
      return {
        bx: ((seed * 127.1) % 1),
        by: ((seed * 311.7) % 1),
        phase: seed * Math.PI * 2,
        speed: 0.4 + (seed % 0.4),
        radius: 1.2 + (seed % 2.2),
      };
    });

    let time = 0;
    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      particles.forEach((p) => {
        const flowX = Math.sin(time * p.speed * 0.4 + p.phase) * 38;
        const flowY = Math.cos(time * p.speed * 0.3 + p.phase * 0.7) * 24;

        const bx = p.bx * w;
        const by = p.by * h;
        const dx = p.bx - mx;
        const dy = p.by - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const influence = Math.max(0, 1 - dist * 2.8);

        const x = bx + flowX + influence * Math.cos(time + p.phase) * 36;
        const y = by + flowY + influence * Math.sin(time + p.phase) * 36;

        const pulse = Math.sin(time * p.speed + p.phase) * 0.5 + 0.5;
        const alpha = 0.08 + pulse * 0.18 + influence * 0.3;

        ctx.beginPath();
        ctx.arc(x, y, p.radius + pulse * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();
      });

      time += 0.016;
      frameRef.current = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-auto"
      style={{ width: "100%", height: "100%" }}
    />
  );
}

export function FeaturesSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="features"
      ref={sectionRef}
      className="relative py-24 lg:py-32 overflow-hidden"
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Header - Full width with diagonal layout */}
        <div className="relative mb-24 lg:mb-32">
          <div className="grid lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-7">
              <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
                <span className="w-12 h-px bg-foreground/30" />
                How Rapport works
              </span>
              <h2
                className={`text-6xl md:text-7xl lg:text-[128px] font-display tracking-tight leading-[0.9] transition-all duration-1000 ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
              >
                Talk once.
                <br />
                <span className="text-muted-foreground">Verified after.</span>
              </h2>
            </div>
            <div className="lg:col-span-5 lg:pb-4">
              <p className={`text-xl text-muted-foreground leading-relaxed transition-all duration-1000 delay-200 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}>
                A 60-second voice note becomes CRM updates, compliance logs, and portfolio
                moves — every number checked in code before anything commits.
              </p>
            </div>
          </div>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid lg:grid-cols-12 gap-4 lg:gap-6">
          {/* Large feature card — the Echo */}
          <div
            className={`lg:col-span-12 relative bg-black border border-foreground/10 min-h-[500px] overflow-hidden group transition-all duration-700 flex ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
            }`}
          >
            {/* Left: text content */}
            <div className="relative flex-1 p-8 lg:p-12 bg-black">
              <ParticleVisualization />
              <div className="relative z-10">
                <span className="font-mono text-sm text-muted-foreground">01</span>
                <h3 className="text-3xl lg:text-4xl font-display mt-4 mb-6 group-hover:translate-x-2 transition-transform duration-500">
                  The 60-second Echo
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-md mb-8">
                  Talk for a minute after a client meeting. Rapport transcribes the brief,
                  extracts the intent, and writes the back-office — so you stay with your
                  client, not your keyboard.
                </p>
                <div>
                  <span className="text-5xl lg:text-6xl font-display">60s</span>
                  <span className="block text-sm text-muted-foreground font-mono mt-2">
                    to a finished back-office
                  </span>
                </div>
              </div>
            </div>

            {/* Right: mirrored image, full height */}
            <div className="hidden lg:block relative w-[42%] shrink-0 overflow-hidden">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Upscaled%20Image%20%2812%29-ng3RrNnsPMJ5CrtOjcPTmhHg01W11q.png"
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover object-center"
                style={{ transform: "scaleX(-1)", filter: "hue-rotate(205deg) saturate(0.6) brightness(0.95)" }}
              />
              {/* Fade left edge into black */}
              <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent" />
            </div>
          </div>

          {/* Three pillars */}
          {pillars.map((pillar, index) => (
            <div
              key={pillar.number}
              className={`lg:col-span-4 relative bg-black border border-foreground/10 p-8 lg:p-10 flex flex-col justify-between min-h-[340px] group transition-all duration-700 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
              }`}
              style={{ transitionDelay: `${(index + 1) * 100}ms` }}
            >
              <div>
                <span className="font-mono text-sm text-muted-foreground">{pillar.number}</span>
                <h3 className="text-2xl lg:text-3xl font-display mt-4 mb-5 group-hover:translate-x-1 transition-transform duration-500">
                  {pillar.title}
                </h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  {pillar.description}
                </p>
              </div>
              <div className="mt-8">
                <span className="text-4xl lg:text-5xl font-display">{pillar.stat.value}</span>
                <span className="block text-sm text-muted-foreground font-mono mt-2">
                  {pillar.stat.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
