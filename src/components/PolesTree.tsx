"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

interface MemberNode {
  id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  role_label: string;
  is_vp: boolean;
}

interface PoleNode {
  id: string;
  name: string;
  description: string;
  color: string;
  vp: MemberNode | null;
  members: MemberNode[];
}

interface PolesTreeProps {
  poles: PoleNode[];
}

export default function PolesTree({ poles }: PolesTreeProps) {
  const [hoveredPoleId, setHoveredPoleId] = useState<string | null>(null);
  const [selectedPoleId, setSelectedPoleId] = useState<string | null>(null);

  // Initialize selected pole as the first one if available
  useEffect(() => {
    if (poles.length > 0 && !selectedPoleId) {
      setSelectedPoleId(poles[0].id);
    }
  }, [poles, selectedPoleId]);

  // Precompute 5 giant PCB processing units with custom technical serial codes and coordinates
  const computedPoles = poles.map((pole, pIndex) => {
    // Majestic routed traces that expand outwards and upwards symmetrically
    const routingPaths = [
      {
        x: 150,
        y: 290,
        path: "M 380 430 L 250 430 L 150 380 L 150 290", // Outer Left
        serial: "IC-EVEN-404",
      },
      {
        x: 275,
        y: 230,
        path: "M 390 430 L 390 340 L 275 290 L 275 230", // Inner Left
        serial: "IC-COMM-200",
      },
      {
        x: 400,
        y: 180,
        path: "M 400 430 L 400 180", // Straight Center
        serial: "IC-TAVN-101",
      },
      {
        x: 525,
        y: 230,
        path: "M 410 430 L 410 340 L 525 290 L 525 230", // Inner Right
        serial: "IC-PART-808",
      },
      {
        x: 650,
        y: 290,
        path: "M 420 430 L 550 430 L 650 380 L 650 290", // Outer Right
        serial: "IC-SPRT-007",
      },
    ];

    const route = routingPaths[pIndex] || routingPaths[2];

    return {
      ...pole,
      x: route.x,
      y: route.y,
      pcbPath: route.path,
      serial: route.serial,
    };
  });

  const socketX = 400;
  const socketY = 430;

  const activePoleId = hoveredPoleId || selectedPoleId;
  const activePole = computedPoles.find((p) => p.id === activePoleId) || computedPoles[0];

  const getPoleIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("éven") || n.includes("even")) return "star";
    if (n.includes("com")) return "campaign";
    if (n.includes("jeux") || n.includes("gaming") || n.includes("esport") || n.includes("play")) return "sports_esports";
    if (n.includes("taverne") || n.includes("bar") || n.includes("snack") || n.includes("boisson")) return "local_cafe";
    if (n.includes("partenariat") || n.includes("partenaires") || n.includes("sponsor")) return "handshake";
    if (n.includes("sport")) return "sports_soccer";
    return "groups";
  };

  return (
    <div className="w-full space-y-12">
      {/* Interactive Motherboard PCB Viewport */}
      <div className="relative glass-panel rounded-3xl p-6 md:p-8 border border-outline-variant/15 shadow-2xl overflow-hidden bg-[#050914] min-h-[500px]">
        {/* Technical Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

        {/* Futuristic glowing circuits on corners */}
        <div className="absolute -top-10 -left-10 w-64 h-64 bg-primary/5 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-tertiary/5 rounded-full blur-[90px] pointer-events-none" />

        {/* SVG Schematic Canvas */}
        <svg
          viewBox="0 0 800 480"
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            <style>{`
              .pcb-trace {
                stroke-linejoin: round;
                stroke-linecap: round;
                transition: stroke-width 0.4s ease, stroke 0.4s ease;
              }
              .pcb-glow {
                filter: drop-shadow(0 0 8px currentColor);
                transition: stroke 0.4s ease;
              }
              .sap-pulse {
                stroke-linecap: round;
                stroke-linejoin: round;
                stroke-dasharray: 6, 15;
                animation: sap-flow 1.8s linear infinite;
              }
              .sap-pulse-active {
                stroke-linecap: round;
                stroke-linejoin: round;
                stroke-dasharray: 4, 8;
                animation: sap-flow 0.7s linear infinite;
              }
              .chip-giant {
                transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), stroke-width 0.3s ease;
              }
              .console-text {
                animation: blink 1.5s infinite;
              }
              @keyframes sap-flow {
                from { stroke-dashoffset: 36; }
                to { stroke-dashoffset: 0; }
              }
              @keyframes blink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.3; }
              }
            `}</style>

            {/* Glowing filter for neon LEDs */}
            <filter id="ledGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* ================= BACKGROUND TELEMETRY DIAGRAMS ================= */}
          
          {/* Top-Left: Green Glass Diagnostic Terminal */}
          <g>
            <rect x={15} y={15} width={180} height={120} rx={6} fill="rgba(6, 12, 26, 0.85)" stroke="#1a2e46" strokeWidth={1} />
            <rect x={20} y={20} width={170} height={18} rx={3} fill="#0d182b" />
            
            {/* Blinking green telemetry status dot */}
            <circle cx={30} cy={29} r={3} fill="#10b981" className="console-text" />
            <text x={38} y={32} className="fill-emerald-400 font-mono text-[7px] tracking-widest font-bold">MONITOR_LOG_v2.0</text>
            
            {/* Scrolling fictional console lines */}
            <text x={25} y={55} className="fill-emerald-500/70 font-mono text-[6.5px] font-semibold">{`> SYSTEM: CONNECTED`}</text>
            <text x={25} y={70} className="fill-emerald-500/70 font-mono text-[6.5px]">{`> CLOCK_CORE: 4.88 GHz`}</text>
            <text x={25} y={85} className="fill-emerald-500/70 font-mono text-[6.5px]">{`> STABLE_VOLTAGE: 1.22V`}</text>
            <text x={25} y={100} className="fill-emerald-500/70 font-mono text-[6.5px]">{`> ACTIVE_POLES: 5/5`}</text>
            <text x={25} y={115} className="fill-emerald-400 font-mono text-[6.5px] font-bold">{`> POLE_SELECTED: ${activePole.name.toUpperCase()} _`}</text>
          </g>

          {/* Top-Right: Oscilloscope Wave Analyzer */}
          <g>
            <rect x={605} y={15} width={180} height={120} rx={6} fill="rgba(6, 12, 26, 0.85)" stroke="#1a2e46" strokeWidth={1} />
            <rect x={610} y={20} width={170} height={18} rx={3} fill="#0d182b" />
            
            <circle cx={620} cy={29} r={3} fill={activePole.color} className="console-text" />
            <text x={628} y={32} className="fill-on-surface font-mono text-[7px] tracking-widest font-bold" style={{ color: activePole.color }}>SIGNAL_WAVE</text>
            
            {/* Oscilloscope Grid Gridlines */}
            <line x1={615} y1={75} x2={775} y2={75} stroke="#ffffff" strokeWidth={0.5} opacity={0.06} />
            <line x1={695} y1={45} x2={695} y2={125} stroke="#ffffff" strokeWidth={0.5} opacity={0.06} />
            
            {/* Beautiful real dynamic green/cyan oscilloscope sine wave */}
            <path
              d={`M 615 75 Q 635 35, 655 75 T 695 75 T 735 75 T 775 75`}
              fill="none"
              stroke={activePole.color}
              strokeWidth={1.5}
              className="pcb-glow"
              style={{ color: activePole.color }}
              opacity={0.8}
            />
            
            <text x={620} y={120} className="fill-on-surface-variant/40 font-mono text-[5.5px]">FREQ: 154.2 MHz</text>
            <text x={720} y={120} className="fill-on-surface-variant/40 font-mono text-[5.5px]">AMP: +1.8dBm</text>
          </g>

          {/* ================= MAIN PCB CIRCUIT TRACES ================= */}
          {computedPoles.map((pole) => {
            const isActive = hoveredPoleId === pole.id || (selectedPoleId === pole.id && !hoveredPoleId);

            return (
              <g key={`trace-${pole.id}`}>
                {/* Copper bottom trace */}
                <path
                  d={pole.pcbPath}
                  fill="none"
                  stroke={isActive ? pole.color : "#141c2f"}
                  strokeWidth={isActive ? 5.5 : 2.5}
                  className="pcb-trace pcb-glow"
                  style={{ color: pole.color }}
                  opacity={isActive ? 0.95 : 0.4}
                />
                
                {/* Gold energy pulses overlay */}
                <path
                  d={pole.pcbPath}
                  fill="none"
                  stroke={isActive ? "#ffffff" : pole.color}
                  strokeWidth={1.5}
                  className={isActive ? "sap-pulse-active" : "sap-pulse"}
                  opacity={isActive ? 1 : 0.2}
                />
              </g>
            );
          })}

          {/* Faint Parallel Bus Tracks in Trunk Section */}
          <g opacity={0.3}>
            <line x1={390} y1={430} x2={390} y2={370} stroke="#ffffff" strokeWidth={0.8} strokeDasharray="3,3" />
            <line x1={400} y1={430} x2={400} y2={370} stroke="#ffffff" strokeWidth={0.8} />
            <line x1={410} y1={430} x2={410} y2={370} stroke="#ffffff" strokeWidth={0.8} strokeDasharray="3,3" />
          </g>

          {/* ================= PRIMARY CONNECTORS ================= */}

          {/* Base CPU Connector Socket [CORE_0x00] */}
          <g className="cursor-pointer">
            <rect
              x={350}
              y={412}
              width={100}
              height={42}
              rx={4}
              fill="#060b18"
              stroke="var(--color-primary)"
              strokeWidth={1.8}
              filter="drop-shadow(0 4px 10px rgba(0,0,0,0.5))"
            />
            <rect
              x={356}
              y={418}
              width={88}
              height={30}
              rx={2}
              fill="#0b1222"
              stroke="var(--color-outline-variant)"
              strokeWidth={0.8}
            />
            {/* Gold interface pins */}
            {Array.from({ length: 12 }).map((_, idx) => (
              <circle key={idx} cx={362 + idx * 7} cy={422} r={1} fill="#ffd700" />
            ))}
            {Array.from({ length: 12 }).map((_, idx) => (
              <circle key={idx} cx={362 + idx * 7} cy={444} r={1} fill="#ffd700" />
            ))}

            <text
              x={socketX}
              y={socketY + 5}
              textAnchor="middle"
              className="fill-on-surface font-mono font-bold text-[8px] tracking-[0.25em]"
            >
              BDE_CORE_0x00
            </text>
          </g>

          {/* ================= MAJESTIC PROCESSING UNITS (Pole Chips) ================= */}
          {computedPoles.map((pole) => {
            const isHovered = hoveredPoleId === pole.id;
            const isSelected = selectedPoleId === pole.id && !hoveredPoleId;
            const isActive = isHovered || isSelected;

            const px = pole.x;
            const py = pole.y;

            return (
              <g
                key={`chip-${pole.id}`}
                className="cursor-pointer chip-giant"
                onMouseEnter={() => setHoveredPoleId(pole.id)}
                onMouseLeave={() => setHoveredPoleId(null)}
                onClick={() => setSelectedPoleId(pole.id)}
                style={{ transform: `scale(${isActive ? 1.06 : 1})`, transformOrigin: `${px}px ${py}px` }}
              >
                {/* Heavy active ping glow circle */}
                {isActive && (
                  <circle
                    cx={px}
                    cy={py}
                    r={45}
                    fill="none"
                    stroke={pole.color}
                    strokeWidth={1.5}
                    opacity={0.3}
                    className="animate-ping"
                    style={{ transformOrigin: `${px}px ${py}px` }}
                  />
                )}

                {/* Golden/Metallic Connector pins (Top, Bottom, Left, Right) */}
                <g opacity={isActive ? 1 : 0.6}>
                  {/* Left pins */}
                  <rect x={px - 39} y={py - 20} width={4} height={3} fill="#ffd700" />
                  <rect x={px - 39} y={py - 10} width={4} height={3} fill="#ffd700" />
                  <rect x={px - 39} y={py} width={4} height={3} fill="#ffd700" />
                  <rect x={px - 39} y={py + 10} width={4} height={3} fill="#ffd700" />
                  <rect x={px - 39} y={py + 20} width={4} height={3} fill="#ffd700" />
                  
                  {/* Right pins */}
                  <rect x={px + 35} y={py - 20} width={4} height={3} fill="#ffd700" />
                  <rect x={px + 35} y={py - 10} width={4} height={3} fill="#ffd700" />
                  <rect x={px + 35} y={py} width={4} height={3} fill="#ffd700" />
                  <rect x={px + 35} y={py + 10} width={4} height={3} fill="#ffd700" />
                  <rect x={px + 35} y={py + 20} width={4} height={3} fill="#ffd700" />

                  {/* Top pins */}
                  <rect x={px - 20} y={py - 39} width={3} height={4} fill="#ffd700" />
                  <rect x={px - 10} y={py - 39} width={3} height={4} fill="#ffd700" />
                  <rect x={px} y={py - 39} width={3} height={4} fill="#ffd700" />
                  <rect x={px + 10} y={py - 39} width={3} height={4} fill="#ffd700" />
                  <rect x={px + 20} y={py - 39} width={3} height={4} fill="#ffd700" />

                  {/* Bottom pins */}
                  <rect x={px - 20} y={py + 35} width={3} height={4} fill="#ffd700" />
                  <rect x={px - 10} y={py + 35} width={3} height={4} fill="#ffd700" />
                  <rect x={px} y={py + 35} width={3} height={4} fill="#ffd700" />
                  <rect x={px + 10} y={py + 35} width={3} height={4} fill="#ffd700" />
                  <rect x={px + 20} y={py + 35} width={3} height={4} fill="#ffd700" />
                </g>

                {/* Substrate Base Chip (Obsidian high-tech processor board) */}
                <rect
                  x={px - 35}
                  y={py - 35}
                  width={70}
                  height={70}
                  rx={4}
                  fill={isActive ? pole.color : "#0a0f21"}
                  stroke={isActive ? "#ffffff" : pole.color}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  filter="drop-shadow(0 6px 12px rgba(0,0,0,0.75))"
                />

                {/* Golden central silicon die */}
                <rect
                  x={px - 18}
                  y={py - 18}
                  width={36}
                  height={36}
                  rx={2}
                  fill="rgba(12, 20, 38, 0.95)"
                  stroke={isActive ? "#ffffff" : "#ffd700"}
                  strokeWidth={0.8}
                />

                {/* Glowing LED indicator in core */}
                <circle
                  cx={px - 10}
                  cy={py - 10}
                  r={2.5}
                  fill={pole.color}
                  filter="url(#ledGlow)"
                  className={isActive ? "console-text" : ""}
                />

                {/* Icon inside silicon core */}
                <text
                  x={px}
                  y={py + 8}
                  textAnchor="middle"
                  className={`material-symbols-outlined select-none pointer-events-none transition-all duration-300 ${isActive ? "fill-white text-white" : "fill-primary text-primary"}`}
                  style={{
                    fontFamily: "Material Symbols Outlined",
                    fontSize: "20px",
                    color: isActive ? "#ffffff" : pole.color,
                    fill: isActive ? "#ffffff" : pole.color,
                  }}
                >
                  {getPoleIcon(pole.name)}
                </text>

                {/* Serial Label printed on substrate */}
                <text
                  x={px}
                  y={py + 28}
                  textAnchor="middle"
                  className={`font-mono text-[5.5px] font-bold ${isActive ? "fill-white/80" : "fill-on-surface-variant/35"}`}
                >
                  {pole.serial}
                </text>

                {/* HUD Interactive Info Border above chip on hover */}
                {isActive && (
                  <g className="animate-fade-in pointer-events-none">
                    <rect
                      x={px - 60}
                      y={py - 54}
                      width={120}
                      height={16}
                      rx={4}
                      fill="rgba(4, 8, 16, 0.95)"
                      stroke={pole.color}
                      strokeWidth={1}
                    />
                    <text
                      x={px}
                      y={py - 44}
                      textAnchor="middle"
                      className="fill-white font-mono text-[7px] font-bold tracking-wider"
                    >
                      {`PROCESSOR_POLE_${pole.name.toUpperCase()}`}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Main Board Header UI Overlay */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center pointer-events-none">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.3em] font-mono">
            BDE CERI TELEMETRY MAINBOARD
          </p>
        </div>
      </div>

      {/* Bento Detail Card (Double-Layered Processor view + Member listing) */}
      <div className="reveal-card rounded-3xl bg-surface-container-high/40 border border-outline-variant/15 p-1 transition-all duration-500 hover:shadow-[0_20px_40px_rgba(7,13,31,0.55)] min-h-[220px]">
        {activePole ? (
          /* Display the active Pole processor details & full list of rattached members */
          <div className="p-6 md:p-10 rounded-3xl relative overflow-hidden flex flex-col md:flex-row gap-8 md:items-center justify-between">
            <div
              className="absolute -top-24 -left-24 w-80 h-80 rounded-full blur-[100px] opacity-15 pointer-events-none transition-all duration-700"
              style={{ backgroundColor: activePole.color }}
            />

            <div className="space-y-4 md:w-3/5 relative z-10 text-left">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center border border-outline-variant/15 bg-surface-container-low"
                  style={{ boxShadow: `0 0 20px ${activePole.color}25` }}
                >
                  <span
                    className="material-symbols-outlined text-lg"
                    style={{ color: activePole.color }}
                  >
                    {getPoleIcon(activePole.name)}
                  </span>
                </div>
                <div>
                  <h3 className="font-headline font-bold text-2xl md:text-3xl text-on-surface font-headline leading-tight">
                    Pôle {activePole.name}
                  </h3>
                  <p className="text-[9px] text-on-surface-variant/50 font-mono tracking-widest uppercase">
                    {`SYS_SERIAL: ${activePole.serial}`}
                  </p>
                </div>
              </div>

              <p className="font-body text-on-surface-variant/90 text-sm md:text-base leading-relaxed italic">
                "{activePole.description}"
              </p>
              
              {/* Full grid list of members in this pole with avatars inside the Bento card */}
              {activePole.members.length > 0 && (
                <div className="pt-2 space-y-3">
                  <span className="text-[9px] text-on-surface-variant font-mono uppercase tracking-wider block">
                    ÉQUIPE / MEMBRES RATTACHÉS :
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {activePole.members.map((m: any) => (
                      <div key={m.id} className="flex items-center gap-2.5 p-2 rounded-xl bg-surface-container-low border border-outline-variant/10 hover:border-primary/20 transition-all">
                        <div className="w-6 h-6 rounded-full overflow-hidden relative border border-outline-variant/20 shadow-sm flex-shrink-0">
                          {m.photo_url ? (
                            <Image
                              src={m.photo_url}
                              alt={m.first_name}
                              fill
                              className="object-cover"
                              sizes="24px"
                              suppressHydrationWarning
                            />
                          ) : (
                            <div className="w-full h-full bg-surface-container-high flex items-center justify-center text-outline text-[9px] font-bold">
                              {m.first_name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col text-left min-w-0">
                          <span className="text-xs font-bold text-on-surface truncate">
                            {m.first_name} {m.last_name.substring(0, 1)}.
                          </span>
                          <span className="text-[8px] text-on-surface-variant truncate font-mono">
                            {m.role_label}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="md:w-1/3 flex flex-col md:items-end justify-between h-full gap-6 relative z-10">
              {activePole.vp ? (
                <div className="flex items-center gap-3 md:text-right">
                  <div className="flex flex-col text-left md:text-right">
                    <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest font-mono">
                      CHIP_VP_LEADER
                    </span>
                    <span className="text-sm font-bold text-on-surface">
                      {activePole.vp.first_name} {activePole.vp.last_name}
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-primary/30 relative shadow-md">
                    {activePole.vp.photo_url ? (
                      <Image
                        src={activePole.vp.photo_url}
                        alt={activePole.vp.first_name}
                        fill
                        className="object-cover"
                        sizes="48px"
                        suppressHydrationWarning
                      />
                    ) : (
                      <div className="w-full h-full bg-surface-container-low flex items-center justify-center text-outline text-lg font-bold">
                        {activePole.vp.first_name.charAt(0)}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 md:text-right">
                  <div className="flex flex-col text-left md:text-right">
                    <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest font-mono">
                      VP_NOMINATION
                    </span>
                    <span className="text-xs font-semibold text-on-surface-variant italic">
                      Pending assignment...
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-surface-container-low border border-outline-variant/15 flex items-center justify-center text-outline text-lg">
                    ?
                  </div>
                </div>
              )}

              <Link href={`/poles/${activePole.id}`} className="w-full md:w-auto">
                <button
                  className="w-full md:w-auto px-6 py-3 rounded-xl bg-surface-container-lowest hover:bg-primary hover:text-on-primary font-bold text-sm flex items-center justify-center gap-2 border border-outline-variant/15 transition-all shadow-lg group hover:scale-[1.03]"
                  style={{ "--hover-color": activePole.color } as React.CSSProperties}
                >
                  Explorer le Pôle
                  <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">
                    east
                  </span>
                </button>
              </Link>
            </div>
          </div>
        ) : (
          /* General console loading view */
          <div className="p-10 flex items-center justify-center min-h-[220px]">
            <p className="text-on-surface-variant text-sm font-mono tracking-wider italic">
              // Survolez les circuits pour inspecter l'architecture matérielle
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
