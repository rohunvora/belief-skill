/**
 * Generates an Excalidraw diagram for the Bulk Trade Finder architecture.
 * Usage: bun run scripts/gen-bulk-diagram.ts > docs/bulk-architecture.excalidraw
 */

const elements: any[] = [];
let counter = 0;
const uid = () => `e${++counter}`;
const seed = () => Math.floor(Math.random() * 2e9);

function rect(x: number, y: number, w: number, h: number, text: string, opts: any = {}) {
  const rId = uid();
  const tId = uid();
  const fontSize = opts.fontSize || 20;
  const lines = text.split("\n");
  const lineH = fontSize * 1.25;
  const textH = lines.length * lineH;

  elements.push({
    type: "rectangle", id: rId, x, y, width: w, height: h,
    fillStyle: "solid", strokeWidth: opts.strokeWidth ?? 2,
    strokeStyle: opts.strokeStyle || "solid", roughness: 0, opacity: 100, angle: 0,
    strokeColor: opts.strokeColor || "#1e1e1e",
    backgroundColor: opts.bg || "transparent",
    seed: seed(), version: 1, versionNonce: seed(), isDeleted: false,
    groupIds: opts.groupIds || [], frameId: null,
    roundness: { type: 3 },
    boundElements: [{ type: "text", id: tId }],
    updated: Date.now(), link: null, locked: false,
  });

  elements.push({
    type: "text", id: tId,
    x: x + 10, y: y + (h - textH) / 2,
    width: w - 20, height: textH,
    fillStyle: "solid", strokeWidth: 2, strokeStyle: "solid",
    roughness: 0, opacity: 100, angle: 0,
    strokeColor: opts.textColor || "#1e1e1e", backgroundColor: "transparent",
    seed: seed(), version: 1, versionNonce: seed(), isDeleted: false,
    groupIds: opts.groupIds || [], frameId: null, roundness: null,
    boundElements: [], updated: Date.now(), link: null, locked: false,
    fontSize, fontFamily: 1, text, rawText: text,
    textAlign: "center", verticalAlign: "middle",
    containerId: rId, originalText: text,
    autoResize: true, lineHeight: 1.25,
  });

  return rId;
}

function label(x: number, y: number, text: string, opts: any = {}) {
  const id = uid();
  const fontSize = opts.fontSize || 20;
  elements.push({
    type: "text", id, x, y,
    width: text.length * fontSize * 0.55, height: fontSize * 1.25,
    fillStyle: "solid", strokeWidth: 2, strokeStyle: "solid",
    roughness: 0, opacity: 100, angle: 0,
    strokeColor: opts.color || "#1e1e1e", backgroundColor: "transparent",
    seed: seed(), version: 1, versionNonce: seed(), isDeleted: false,
    groupIds: opts.groupIds || [], frameId: null, roundness: null,
    boundElements: [], updated: Date.now(), link: null, locked: false,
    fontSize, fontFamily: opts.fontFamily ?? 1, text, rawText: text,
    textAlign: opts.textAlign || "left", verticalAlign: "top",
    containerId: null, originalText: text,
    autoResize: true, lineHeight: 1.25,
  });
  return id;
}

function arrow(x1: number, y1: number, x2: number, y2: number, opts: any = {}) {
  const id = uid();
  elements.push({
    type: "arrow", id, x: x1, y: y1,
    width: x2 - x1, height: y2 - y1,
    fillStyle: "solid", strokeWidth: 2, strokeStyle: "solid",
    roughness: 0, opacity: 100, angle: 0,
    strokeColor: opts.color || "#1e1e1e", backgroundColor: "transparent",
    seed: seed(), version: 1, versionNonce: seed(), isDeleted: false,
    groupIds: [], frameId: null, roundness: { type: 2 },
    boundElements: [], updated: Date.now(), link: null, locked: false,
    startBinding: null, endBinding: null, lastCommittedPoint: null,
    startArrowhead: null, endArrowhead: "arrow",
    points: [[0, 0], [x2 - x1, y2 - y1]],
  });
  return id;
}

function line(x1: number, y1: number, x2: number, y2: number, opts: any = {}) {
  const id = uid();
  elements.push({
    type: "line", id, x: x1, y: y1,
    width: x2 - x1, height: y2 - y1,
    fillStyle: "solid", strokeWidth: opts.strokeWidth ?? 2,
    strokeStyle: opts.strokeStyle || "dashed", roughness: 0, opacity: 100, angle: 0,
    strokeColor: opts.color || "#868e96", backgroundColor: "transparent",
    seed: seed(), version: 1, versionNonce: seed(), isDeleted: false,
    groupIds: [], frameId: null, roundness: { type: 2 },
    boundElements: [], updated: Date.now(), link: null, locked: false,
    startBinding: null, endBinding: null, lastCommittedPoint: null,
    startArrowhead: null, endArrowhead: null,
    points: [[0, 0], [x2 - x1, y2 - y1]],
  });
}

// ─── COLORS ──────────────────────────────────────────────
const BLUE    = "#a5d8ff";
const GREEN   = "#b2f2bb";
const YELLOW  = "#ffec99";
const ORANGE  = "#ffc9c9";
const PURPLE  = "#d0bfff";
const GRAY    = "#e9ecef";
const WHITE   = "#ffffff";

// ═══════════════════════════════════════════════════════════
// TITLE
// ═══════════════════════════════════════════════════════════
label(330, 20, "Bulk Trade Finder — Architecture Options", { fontSize: 28, fontFamily: 1 });

// ═══════════════════════════════════════════════════════════
// SECTION 1: CURRENT STATE
// ═══════════════════════════════════════════════════════════
label(50, 90, "CURRENT", { fontSize: 16, color: "#868e96" });
label(135, 90, "One thesis at a time", { fontSize: 16, color: "#868e96" });

const cy = 130;
rect(50, cy, 150, 55, "1 Thesis", { bg: BLUE });
arrow(200, cy + 28, 250, cy + 28);
rect(250, cy - 10, 220, 75, "Research\n3-10 web searches", { bg: BLUE });
arrow(470, cy + 28, 520, cy + 28);
rect(520, cy - 10, 200, 75, "Score & Select\nFull rubric", { bg: BLUE });
arrow(720, cy + 28, 770, cy + 28);
rect(770, cy, 140, 55, "1 Card", { bg: BLUE });

label(380, cy + 80, "30-60 seconds · Deep but serial", { fontSize: 14, color: "#868e96" });

// ─── Divider ───
line(50, 240, 1350, 240, { color: "#dee2e6", strokeWidth: 1 });

// ═══════════════════════════════════════════════════════════
// SECTION 2: BULK PIPELINE
// ═══════════════════════════════════════════════════════════
label(50, 260, "PROPOSED", { fontSize: 16, color: "#868e96" });
label(160, 260, "Three-phase pipeline", { fontSize: 16, color: "#868e96" });

const py = 310;
const boxH = 130;

// Input
rect(50, py, 170, boxH, "Transcript\nor Article\n\n12+ claims", { bg: GRAY });

// Arrow with funnel label
arrow(220, py + boxH/2, 290, py + boxH/2);

// Phase 1
rect(290, py, 230, boxH, "Phase 1\nExtract & Cluster\n\nLLM only · No tools\n~5 seconds", { bg: GREEN });

// Arrow + funnel
arrow(520, py + boxH/2, 590, py + boxH/2);
label(530, py + boxH/2 - 22, "5-15", { fontSize: 14, color: "#2b8a3e" });
label(525, py + boxH/2 - 5, "theses", { fontSize: 14, color: "#2b8a3e" });

// Phase 2
rect(590, py, 240, boxH, "Phase 2\nInstrument Sweep\n\nBatched · Parallel\n6-8 calls · ~10s", { bg: YELLOW });

// Arrow + funnel
arrow(830, py + boxH/2, 900, py + boxH/2);
label(840, py + boxH/2 - 22, "Top", { fontSize: 14, color: "#e67700" });
label(840, py + boxH/2 - 5, "3-5", { fontSize: 14, color: "#e67700" });

// Phase 3
rect(900, py, 230, boxH, "Phase 3\nDeep Route\n\nFull skill × N\nParallel agents", { bg: ORANGE });

// Arrow to output
arrow(1130, py + boxH/2, 1190, py + boxH/2);

// Output
rect(1190, py, 200, boxH, "Scan Output\n\n3 Full Cards\n5 Quick Hits\nTrack All", { bg: PURPLE });

// Efficiency callout
label(290, py + boxH + 15, "No API calls", { fontSize: 13, color: "#2b8a3e" });
label(610, py + boxH + 15, "robinhood/instruments.ts", { fontSize: 13, color: "#e67700" });
label(610, py + boxH + 33, "batches 10 tickers per call", { fontSize: 13, color: "#e67700" });
label(920, py + boxH + 15, "Reuses full belief-router", { fontSize: 13, color: "#c92a2a" });

// Total time callout
rect(460, py + boxH + 60, 450, 40, "Total: ~45-90 seconds for 12 theses (vs 6-12 min serial)", { bg: WHITE, strokeColor: "#868e96", strokeWidth: 1, fontSize: 14 });

// ─── Divider ───
line(50, 560, 1350, 560, { color: "#dee2e6", strokeWidth: 1 });

// ═══════════════════════════════════════════════════════════
// SECTION 3: IMPLEMENTATION OPTIONS
// ═══════════════════════════════════════════════════════════
label(50, 575, "IMPLEMENTATION OPTIONS", { fontSize: 16, color: "#868e96" });

const oy = 610;
const optW = 380;
const optH = 220;
const gap = 30;

// Option A — Recommended
rect(50, oy, optW, optH,
  "Option A: Mode in SKILL.md\n\nAdd ## Bulk Mode section\nto existing skill prompt\n\n+ Simple — one file to maintain\n+ Reuses existing routing logic\n+ No new infrastructure\n− Prompt grows longer",
  { bg: "#d3f9d8", strokeColor: "#2b8a3e", strokeWidth: 3, fontSize: 16 }
);
label(55, oy + optH + 8, "★ RECOMMENDED to start", { fontSize: 15, color: "#2b8a3e" });

// Option B
rect(50 + optW + gap, oy, optW, optH,
  "Option B: Separate Skill\n\nbelief-scanner orchestrates\nbelief-router routes each\n\n+ Clean separation of concerns\n+ Independent testing\n− Two skills to sync & maintain\n− More moving parts",
  { bg: "#fff3bf", strokeColor: "#e67700", fontSize: 16 }
);

// Option C
rect(50 + 2*(optW + gap), oy, optW, optH,
  "Option C: Script-based\n\nscripts/extract.ts for P1+P2\nOutputs structured JSON\n\n+ Testable outside Claude\n+ Minimal prompt bloat\n− More TypeScript to maintain\n− Less LLM flexibility in P1",
  { bg: "#ffe8cc", strokeColor: "#d9480f", fontSize: 16 }
);

// ─── Divider ───
line(50, oy + optH + 45, 1350, oy + optH + 45, { color: "#dee2e6", strokeWidth: 1 });

// ═══════════════════════════════════════════════════════════
// SECTION 4: KEY NEW WORK
// ═══════════════════════════════════════════════════════════
label(50, oy + optH + 60, "KEY NEW WORK", { fontSize: 16, color: "#868e96" });

const ky = oy + optH + 90;

rect(50, ky, 280, 70, "Extraction prompt\nengineering for P1", { bg: GREEN, fontSize: 15 });
rect(360, ky, 280, 70, "Batch instrument\nadapter (comma tickers)", { bg: YELLOW, fontSize: 15 });
rect(670, ky, 280, 70, "Scan output format\n+ summary table", { bg: PURPLE, fontSize: 15 });
rect(980, ky, 280, 70, "track.ts bulk-record\ncommand", { bg: ORANGE, fontSize: 15 });

// ═══════════════════════════════════════════════════════════
// WRITE FILE
// ═══════════════════════════════════════════════════════════
const doc = {
  type: "excalidraw",
  version: 2,
  source: "belief-skill-gen",
  elements,
  appState: {
    viewBackgroundColor: "#ffffff",
    gridSize: null,
  },
  files: {},
};

console.log(JSON.stringify(doc, null, 2));
