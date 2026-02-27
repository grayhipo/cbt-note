export function genId() {
  return Math.random().toString(36).slice(2, 9);
}

export function formatWhen(raw) {
  if (!raw) return "";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleString("ja-JP", {
    year: "numeric", month: "long", day: "numeric",
    weekday: "short", hour: "2-digit", minute: "2-digit"
  });
}

// ── CSV Utilities ─────────────────────────────────────────────────────────────
export const CSV_HEADERS = [
  "id", "createdAt",
  "situation_when", "situation_where", "situation_who",
  "moods", "automaticThoughts",
  "evidence", "counterEvidence",
  "adaptiveThoughts", "moodReEvaluation"
];

export function escapeCsvCell(val) {
  if (val === null || val === undefined) return "";
  const s = typeof val === "string" ? val : JSON.stringify(val);
  if (s.includes(",") || s.includes("\n") || s.includes('"')) {
    return '"' + s.replace(/"/g, '""'  ) + '"';
  }
  return s;
}

export function parseCsvLine(line) {
  const result = [];
  let cur = "", inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuote) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') { inQuote = false; }
      else cur += ch;
    } else {
      if (ch === '"') { inQuote = true; }
      else if (ch === ",") { result.push(cur); cur = ""; }
      else cur += ch;
    }
  }
  result.push(cur);
  return result;
}

export function csvToRecords(csvText) {
  const lines = csvText.replace(/^\uFEFF/, "").split("\n").filter(l => l.trim());
  if (lines.length < 2) throw new Error("データが見つかりません");
  const header = parseCsvLine(lines[0]);
  const idx = name => header.indexOf(name);
  return lines.slice(1).map(line => {
    const cols = parseCsvLine(line);
    const get = name => cols[idx(name)] ?? "";
    function tryJson(s, fallback) {
      try { return JSON.parse(s); } catch { return fallback; }
    }
    return {
      id: get("id") || genId(),
      createdAt: get("createdAt") || new Date().toISOString(),
      situation: { when: get("situation_when"), where: get("situation_where"), who: get("situation_who") },
      moods: tryJson(get("moods"), []),
      automaticThoughts: tryJson(get("automaticThoughts"), [{ id: genId(), text: "", isKey: false }]),
      evidence: get("evidence"),
      counterEvidence: get("counterEvidence"),
      adaptiveThoughts: tryJson(get("adaptiveThoughts"), [{ id: genId(), text: "", type: "balanced", confidence: 50 }]),
      moodReEvaluation: tryJson(get("moodReEvaluation"), []),
    };
  });
}
