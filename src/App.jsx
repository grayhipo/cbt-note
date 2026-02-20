import { useState, useEffect, useCallback } from "react";

// ── Google Fonts injected via style tag ──────────────────────────────────────
const FontStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;500;700&family=Shippori+Mincho:wght@400;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #f7f4ee;
      --surface: #fffefb;
      --surface2: #f0ede5;
      --border: #d8d0c0;
      --accent: #5a7a5a;
      --accent-light: #8aaa7a;
      --accent-muted: #d4e0d4;
      --text: #2a2a20;
      --text-muted: #7a7568;
      --danger: #c0604a;
      --warn: #c08030;
      --radius: 12px;
      --shadow: 0 2px 12px rgba(60,55,40,0.10);
    }
    body { background: var(--bg); color: var(--text); font-family: 'Zen Kaku Gothic New', sans-serif; }
    ::placeholder { color: var(--text-muted); opacity: 0.7; }
    textarea, input { font-family: inherit; font-size: 0.95rem; color: var(--text); }
    textarea:focus, input:focus { outline: none; }
    button { font-family: inherit; cursor: pointer; }
    * { transition: box-shadow 0.15s, border-color 0.15s, background 0.15s; }
    .slide-in { animation: slideIn 0.3s ease; }
    @keyframes slideIn { from { opacity:0; transform: translateY(10px); } to { opacity:1; transform: translateY(0); } }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: var(--bg); }
    ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
    .drawer-overlay { position: fixed; inset: 0; background: rgba(42,42,32,0.35); z-index: 100; animation: fadeIn 0.2s ease; }
    .drawer { position: fixed; top: 0; right: 0; bottom: 0; width: min(320px, 88vw); background: var(--surface); z-index: 101; box-shadow: -4px 0 24px rgba(60,55,40,0.18); animation: slideRight 0.25s ease; display: flex; flex-direction: column; }
    @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
    @keyframes slideRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
    .drawer-item { display: flex; align-items: center; gap: 12px; padding: 14px 20px; font-size: 0.95rem; font-weight: 500; color: var(--text); border: none; background: none; text-align: left; cursor: pointer; border-bottom: 1px solid var(--border); width: 100%; font-family: inherit; }
    .drawer-item:hover { background: var(--surface2); }
    .drawer-item:disabled { opacity: 0.4; cursor: not-allowed; }
    .drawer-item label { display: flex; align-items: center; gap: 12px; cursor: pointer; width: 100%; }
  `}</style>
);

const CSS = {
  app: { minHeight: "100vh", background: "var(--bg)", padding: "0 0 80px" },
  header: {
    background: "var(--surface)",
    borderBottom: "1px solid var(--border)",
    padding: "16px 20px",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    position: "sticky", top: 0, zIndex: 10,
    boxShadow: "0 1px 8px rgba(60,55,40,0.06)"
  },
  headerTitle: { fontFamily: "'Shippori Mincho', serif", fontSize: "1.2rem", fontWeight: 600, color: "var(--accent)", letterSpacing: "0.04em" },
  card: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", boxShadow: "var(--shadow)", padding: "20px", marginBottom: "12px" },
  input: {
    width: "100%", padding: "10px 14px",
    background: "var(--surface2)", border: "1.5px solid var(--border)",
    borderRadius: 8, fontSize: "0.95rem", lineHeight: 1.5,
    "&:focus": { borderColor: "var(--accent)" }
  },
  textarea: {
    width: "100%", padding: "10px 14px",
    background: "var(--surface2)", border: "1.5px solid var(--border)",
    borderRadius: 8, fontSize: "0.95rem", lineHeight: 1.6,
    resize: "vertical", minHeight: 100,
  },
  label: { display: "block", fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: 6, fontWeight: 500, letterSpacing: "0.04em" },
  btn: {
    padding: "10px 22px", borderRadius: 8, border: "none",
    fontWeight: 700, fontSize: "0.92rem", letterSpacing: "0.03em",
  },
  btnPrimary: { background: "var(--accent)", color: "#fff" },
  btnGhost: { background: "transparent", color: "var(--text-muted)", border: "1.5px solid var(--border)" },
  btnDanger: { background: "transparent", color: "var(--danger)", border: "1.5px solid var(--danger)", padding: "6px 14px", fontSize: "0.82rem" },
  btnSmall: { padding: "6px 14px", fontSize: "0.82rem", borderRadius: 6 },
  stepTitle: { fontFamily: "'Shippori Mincho', serif", fontSize: "1.3rem", fontWeight: 600, color: "var(--accent)", marginBottom: 4 },
  stepSub: { fontSize: "0.83rem", color: "var(--text-muted)", marginBottom: 20, lineHeight: 1.6 },
  fieldGroup: { marginBottom: 16 },
  row: { display: "flex", gap: 10, alignItems: "center" },
  chip: {
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: "6px 14px", borderRadius: 20, border: "1.5px solid var(--border)",
    fontSize: "0.85rem", fontWeight: 500, cursor: "pointer",
    background: "var(--surface2)", color: "var(--text)",
  },
  chipActive: { background: "var(--accent-muted)", borderColor: "var(--accent)", color: "var(--accent)" },
  slider: { width: "100%", accentColor: "var(--accent)", cursor: "pointer" },
  badge: { display: "inline-block", padding: "2px 10px", borderRadius: 20, fontSize: "0.78rem", fontWeight: 700 },
  divider: { height: 1, background: "var(--border)", margin: "16px 0" },
  floatBar: {
    position: "fixed", bottom: 0, left: 0, right: 0,
    background: "var(--surface)", borderTop: "1px solid var(--border)",
    padding: "12px 20px", display: "flex", gap: 10, justifyContent: "flex-end",
    boxShadow: "0 -2px 12px rgba(60,55,40,0.08)"
  },
};

const DEFAULT_MOODS = ["不安", "無力感", "怒り", "悲しみ", "恥", "罪悪感", "孤独", "恐怖", "混乱", "落ち込み", "イライラ", "焦り"];

function genId() { return Math.random().toString(36).slice(2, 9); }

function formatWhen(raw) {
  if (!raw) return "";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleString("ja-JP", {
    year: "numeric", month: "long", day: "numeric",
    weekday: "short", hour: "2-digit", minute: "2-digit"
  });
}

function getInitialForm() {
  return {
    situation: { when: "", where: "", who: "" },
    moods: [],
    automaticThoughts: [{ id: genId(), text: "", isKey: false }],
    evidence: "",
    counterEvidence: "",
    adaptiveThoughts: [{ id: genId(), text: "", type: "balanced", confidence: 50 }],
    moodReEvaluation: [],
  };
}

// ── Input helpers ─────────────────────────────────────────────────────────────
function Inp({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div style={CSS.fieldGroup}>
      {label && <label style={CSS.label}>{label}</label>}
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ ...CSS.input, display: "block", border: "1.5px solid var(--border)" }}
        onFocus={e => e.target.style.borderColor = "var(--accent)"}
        onBlur={e => e.target.style.borderColor = "var(--border)"}
      />
    </div>
  );
}

function Txta({ label, value, onChange, placeholder, rows = 4 }) {
  return (
    <div style={CSS.fieldGroup}>
      {label && <label style={CSS.label}>{label}</label>}
      <textarea
        value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} rows={rows}
        style={{ ...CSS.textarea, display: "block", border: "1.5px solid var(--border)" }}
        onFocus={e => e.target.style.borderColor = "var(--accent)"}
        onBlur={e => e.target.style.borderColor = "var(--border)"}
      />
    </div>
  );
}

function Slider({ value, onChange, label }) {
  return (
    <div>
      {label && <label style={CSS.label}>{label}</label>}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <input type="range" min={0} max={100} value={value} onChange={e => onChange(Number(e.target.value))} style={CSS.slider} />
        <span style={{ minWidth: 44, textAlign: "right", fontWeight: 700, color: "var(--accent)", fontSize: "1rem" }}>{value}%</span>
      </div>
    </div>
  );
}

// ── Step 0: 状況 ──────────────────────────────────────────────────────────────
function Step0({ data, setData }) {
  const s = data.situation;
  const upd = k => v => setData(d => ({ ...d, situation: { ...d.situation, [k]: v } }));

  // Format ISO datetime-local value to human-readable for display in detail view
  // Here we just store raw datetime-local string; detail view formats it
  function handleDateTimeChange(raw) {
    upd("when")(raw); // e.g. "2024-03-15T15:00"
  }

  return (
    <div className="slide-in">
      <div style={CSS.stepTitle}>① 状況</div>
      <div style={CSS.stepSub}>記録する出来事の状況を書き留めましょう。</div>

      <div style={CSS.fieldGroup}>
        <label style={CSS.label}>📅 いつ</label>
        <input
          type="datetime-local"
          value={s.when}
          onChange={e => handleDateTimeChange(e.target.value)}
          style={{
            ...CSS.input,
            display: "block",
            border: "1.5px solid var(--border)",
            colorScheme: "light",
            cursor: "pointer",
          }}
          onFocus={e => e.target.style.borderColor = "var(--accent)"}
          onBlur={e => e.target.style.borderColor = "var(--border)"}
        />
      </div>

      <Inp label="📍 どこで" value={s.where} onChange={upd("where")} placeholder="例：職場の会議室" />
      <Inp label="👤 だれが" value={s.who} onChange={upd("who")} placeholder="例：上司と二人で話していたとき" />
    </div>
  );
}

// ── Step 1: 気分 ──────────────────────────────────────────────────────────────
function Step1({ data, setData, customMoods, setCustomMoods }) {
  const [newMood, setNewMood] = useState("");
  const allMoods = [...DEFAULT_MOODS, ...customMoods];
  const selectedNames = data.moods.map(m => m.name);

  function toggleMood(name) {
    setData(d => {
      const exists = d.moods.find(m => m.name === name);
      if (exists) return { ...d, moods: d.moods.filter(m => m.name !== name) };
      return { ...d, moods: [...d.moods, { name, level: 50 }] };
    });
  }

  function setLevel(name, level) {
    setData(d => ({ ...d, moods: d.moods.map(m => m.name === name ? { ...m, level } : m) }));
  }

  function addCustomMood() {
    const t = newMood.trim();
    if (!t || allMoods.includes(t)) return;
    setCustomMoods(prev => [...prev, t]);
    setNewMood("");
    toggleMood(t);
  }

  return (
    <div className="slide-in">
      <div style={CSS.stepTitle}>② 気分</div>
      <div style={CSS.stepSub}>今どんな気分ですか？当てはまるものを選んでください。複数選択できます。</div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
        {allMoods.map(name => {
          const isSelected = selectedNames.includes(name);
          const isCustom = customMoods.includes(name);
          return (
            <button key={name} onClick={() => toggleMood(name)}
              style={{ ...CSS.chip, ...(isSelected ? CSS.chipActive : {}), position: "relative" }}>
              {isCustom && <span style={{ fontSize: "0.65rem", opacity: 0.6 }}>＊</span>}
              {name}
              {isSelected && <span style={{ marginLeft: 2 }}>✓</span>}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <input value={newMood} onChange={e => setNewMood(e.target.value)}
          placeholder="気分を追加..."
          onKeyDown={e => e.key === "Enter" && addCustomMood()}
          style={{ ...CSS.input, flex: 1, border: "1.5px solid var(--border)" }}
          onFocus={e => e.target.style.borderColor = "var(--accent)"}
          onBlur={e => e.target.style.borderColor = "var(--border)"}
        />
        <button onClick={addCustomMood} style={{ ...CSS.btn, ...CSS.btnPrimary, ...CSS.btnSmall }}>追加</button>
      </div>

      {data.moods.length > 0 && (
        <>
          <div style={CSS.divider} />
          <div style={{ ...CSS.label, marginBottom: 12 }}>選んだ気分のレベルを設定してください</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {data.moods.map(m => (
              <div key={m.name} style={{ background: "var(--accent-muted)", borderRadius: 8, padding: "12px 14px" }}>
                <div style={{ fontWeight: 700, color: "var(--accent)", marginBottom: 8, fontSize: "0.95rem" }}>{m.name}</div>
                <Slider value={m.level} onChange={v => setLevel(m.name, v)} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Step 2: 自動思考 ───────────────────────────────────────────────────────────
function Step2({ data, setData }) {
  function addThought() {
    setData(d => ({ ...d, automaticThoughts: [...d.automaticThoughts, { id: genId(), text: "", isKey: false }] }));
  }
  function updThought(id, k, v) {
    setData(d => ({ ...d, automaticThoughts: d.automaticThoughts.map(t => t.id === id ? { ...t, [k]: v } : t) }));
  }
  function removeThought(id) {
    setData(d => ({ ...d, automaticThoughts: d.automaticThoughts.filter(t => t.id !== id) }));
  }

  return (
    <div className="slide-in">
      <div style={CSS.stepTitle}>③ 自動思考</div>
      <div style={CSS.stepSub}>気分を感じた直前に、頭の中に何が浮かんだか書いてください。<br />気分につながる主な考えには ◯ を付けましょう。</div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {data.automaticThoughts.map((t, i) => (
          <div key={t.id} style={{ ...CSS.card, padding: 14, marginBottom: 0, position: "relative" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <button
                onClick={() => updThought(t.id, "isKey", !t.isKey)}
                title="気分につながる考えに印をつける"
                style={{
                  width: 36, height: 36, borderRadius: "50%", border: "2px solid",
                  borderColor: t.isKey ? "var(--accent)" : "var(--border)",
                  background: t.isKey ? "var(--accent-muted)" : "var(--surface2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1rem", color: t.isKey ? "var(--accent)" : "var(--border)",
                  fontWeight: 700, flexShrink: 0, marginTop: 2,
                }}>
                {t.isKey ? "◯" : "◯"}
              </button>
              <div style={{ flex: 1 }}>
                <textarea
                  value={t.text}
                  onChange={e => updThought(t.id, "text", e.target.value)}
                  placeholder={`思考 ${i + 1}：頭に浮かんだこと、イメージなど`}
                  rows={2}
                  style={{ ...CSS.textarea, minHeight: 60, border: "1.5px solid var(--border)" }}
                  onFocus={e => e.target.style.borderColor = "var(--accent)"}
                  onBlur={e => e.target.style.borderColor = "var(--border)"}
                />
              </div>
              {data.automaticThoughts.length > 1 && (
                <button onClick={() => removeThought(t.id)}
                  style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "1.1rem", padding: "4px", flexShrink: 0 }}>
                  ✕
                </button>
              )}
            </div>
            {t.isKey && <div style={{ fontSize: "0.75rem", color: "var(--accent)", marginTop: 6, marginLeft: 46, fontWeight: 600 }}>◯ 気分につながる考え</div>}
          </div>
        ))}
      </div>

      <button onClick={addThought} style={{ ...CSS.btn, ...CSS.btnGhost, width: "100%", marginTop: 12, border: "1.5px dashed var(--border)" }}>
        ＋ 思考を追加
      </button>
    </div>
  );
}

// ── Step 3: 根拠 ──────────────────────────────────────────────────────────────
function Step3({ data, setData }) {
  const keyThoughts = data.automaticThoughts.filter(t => t.isKey && t.text);
  return (
    <div className="slide-in">
      <div style={CSS.stepTitle}>④ 根拠</div>
      <div style={CSS.stepSub}>自動思考を裏付ける事実を書いてください。<br />「〜だから○○と思う」という客観的な事実を探しましょう。</div>
      {keyThoughts.length > 0 && (
        <div style={{ background: "var(--accent-muted)", borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}>
          <div style={{ fontSize: "0.78rem", color: "var(--accent)", fontWeight: 700, marginBottom: 6 }}>◯ 気分につながる考え</div>
          {keyThoughts.map(t => <div key={t.id} style={{ fontSize: "0.88rem", lineHeight: 1.5, color: "var(--text)" }}>・{t.text}</div>)}
        </div>
      )}
      <Txta value={data.evidence} onChange={v => setData(d => ({ ...d, evidence: v }))}
        placeholder="例：上司がため息をついた。報告書に赤字が多かった。期末評価が下がった。" rows={5} />
    </div>
  );
}

// ── Step 4: 反証 ──────────────────────────────────────────────────────────────
function Step4({ data, setData }) {
  const keyThoughts = data.automaticThoughts.filter(t => t.isKey && t.text);
  return (
    <div className="slide-in">
      <div style={CSS.stepTitle}>⑤ 反証</div>
      <div style={CSS.stepSub}>自動思考と矛盾する事実を書いてください。<br />「○○だけど、△△という事実もある」という視点で。</div>
      {keyThoughts.length > 0 && (
        <div style={{ background: "var(--surface2)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, border: "1px solid var(--border)" }}>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 700, marginBottom: 6 }}>◯ 気分につながる考え</div>
          {keyThoughts.map(t => <div key={t.id} style={{ fontSize: "0.88rem", lineHeight: 1.5, color: "var(--text)" }}>・{t.text}</div>)}
        </div>
      )}
      <Txta value={data.counterEvidence} onChange={v => setData(d => ({ ...d, counterEvidence: v }))}
        placeholder="例：以前のプロジェクトは褒められた。上司は今日体調が悪そうだった。同僚は気にしていなかった。" rows={5} />
    </div>
  );
}

// ── Step 5: 適応的思考 ────────────────────────────────────────────────────────
function Step5({ data, setData }) {
  function addThought() {
    setData(d => ({ ...d, adaptiveThoughts: [...d.adaptiveThoughts, { id: genId(), text: "", type: "balanced", confidence: 50 }] }));
  }
  function upd(id, k, v) {
    setData(d => ({ ...d, adaptiveThoughts: d.adaptiveThoughts.map(t => t.id === id ? { ...t, [k]: v } : t) }));
  }
  function remove(id) {
    setData(d => ({ ...d, adaptiveThoughts: d.adaptiveThoughts.filter(t => t.id !== id) }));
  }

  return (
    <div className="slide-in">
      <div style={CSS.stepTitle}>⑥ 適応的思考</div>
      <div style={CSS.stepSub}>根拠と反証を踏まえて、より現実的・バランスの取れた考えを書きましょう。<br />どの程度確信できるかも評価してください。</div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {data.adaptiveThoughts.map((t, i) => (
          <div key={t.id} style={{ ...CSS.card, marginBottom: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-muted)" }}>思考 {i + 1}</span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  onClick={() => upd(t.id, "type", "new")}
                  style={{ ...CSS.btn, ...CSS.btnSmall, ...(t.type === "new" ? CSS.btnPrimary : CSS.btnGhost) }}>
                  まったく新しい考え
                </button>
                <button
                  onClick={() => upd(t.id, "type", "balanced")}
                  style={{ ...CSS.btn, ...CSS.btnSmall, ...(t.type === "balanced" ? CSS.btnPrimary : CSS.btnGhost) }}>
                  バランスの取れた考え
                </button>
                {data.adaptiveThoughts.length > 1 && (
                  <button onClick={() => remove(t.id)} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "1rem" }}>✕</button>
                )}
              </div>
            </div>
            <textarea
              value={t.text} onChange={e => upd(t.id, "text", e.target.value)}
              placeholder={t.type === "new" ? "まったく別の視点から考えると..." : "根拠と反証を合わせて考えると..."}
              rows={3}
              style={{ ...CSS.textarea, marginBottom: 12, border: "1.5px solid var(--border)" }}
              onFocus={e => e.target.style.borderColor = "var(--accent)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"}
            />
            <Slider value={t.confidence} onChange={v => upd(t.id, "confidence", v)} label="この考えをどの程度確信できますか？" />
          </div>
        ))}
      </div>

      <button onClick={addThought} style={{ ...CSS.btn, ...CSS.btnGhost, width: "100%", marginTop: 12, border: "1.5px dashed var(--border)" }}>
        ＋ 思考を追加
      </button>
    </div>
  );
}

// ── Step 6: 気分の再評価 ──────────────────────────────────────────────────────
function Step6({ data, setData }) {
  useEffect(() => {
    setData(d => {
      const reEval = d.moods.map(m => {
        const existing = d.moodReEvaluation.find(r => r.name === m.name);
        return existing || { name: m.name, before: m.level, after: m.level };
      });
      return { ...d, moodReEvaluation: reEval };
    });
  }, []);

  function setAfter(name, after) {
    setData(d => ({ ...d, moodReEvaluation: d.moodReEvaluation.map(r => r.name === name ? { ...r, after } : r) }));
  }

  if (data.moods.length === 0) {
    return (
      <div className="slide-in">
        <div style={CSS.stepTitle}>⑦ 気分の再評価</div>
        <div style={{ color: "var(--text-muted)", marginTop: 20 }}>② 気分の欄で気分が選択されていません。</div>
      </div>
    );
  }

  return (
    <div className="slide-in">
      <div style={CSS.stepTitle}>⑦ 気分の再評価</div>
      <div style={CSS.stepSub}>適応的思考を経て、今の気分レベルを改めて評価してください。</div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {data.moodReEvaluation.map(r => {
          const diff = r.after - r.before;
          return (
            <div key={r.name} style={{ ...CSS.card, marginBottom: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontWeight: 700, fontSize: "1rem", color: "var(--accent)" }}>{r.name}</span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>最初：{r.before}%</span>
                  {diff !== 0 && (
                    <span style={{
                      ...CSS.badge,
                      background: diff < 0 ? "#d4eed4" : "#fde8e0",
                      color: diff < 0 ? "#3a7a3a" : "var(--danger)"
                    }}>
                      {diff > 0 ? `+${diff}` : diff}%
                    </span>
                  )}
                </div>
              </div>
              <Slider value={r.after} onChange={v => setAfter(r.name, v)} label={`今の${r.name}のレベル`} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Record Detail View ────────────────────────────────────────────────────────
function RecordDetail({ record, onBack, onDelete }) {
  const s = record.situation;
  return (
    <div style={{ padding: "20px", maxWidth: 640, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <button onClick={onBack} style={{ ...CSS.btn, ...CSS.btnGhost, ...CSS.btnSmall }}>← 戻る</button>
        <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>{new Date(record.createdAt).toLocaleString("ja-JP")}</span>
        <button onClick={onDelete} style={{ ...CSS.btn, ...CSS.btnDanger, marginLeft: "auto" }}>削除</button>
      </div>

      {/* 状況 */}
      <div style={CSS.card}>
        <div style={{ fontFamily: "'Shippori Mincho', serif", fontWeight: 600, color: "var(--accent)", marginBottom: 12 }}>① 状況</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {s.when && <div><span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>📅 いつ　　</span>{formatWhen(s.when)}</div>}
          {s.where && <div><span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>📍 どこで　</span>{s.where}</div>}
          {s.who && <div><span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>👤 だれが　</span>{s.who}</div>}
        </div>
      </div>

      {/* 気分 */}
      {record.moods.length > 0 && (
        <div style={CSS.card}>
          <div style={{ fontFamily: "'Shippori Mincho', serif", fontWeight: 600, color: "var(--accent)", marginBottom: 12 }}>② 気分</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {record.moods.map(m => (
              <div key={m.name} style={{ ...CSS.chip, ...CSS.chipActive }}>
                {m.name} <strong>{m.level}%</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 自動思考 */}
      {record.automaticThoughts.some(t => t.text) && (
        <div style={CSS.card}>
          <div style={{ fontFamily: "'Shippori Mincho', serif", fontWeight: 600, color: "var(--accent)", marginBottom: 12 }}>③ 自動思考</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {record.automaticThoughts.filter(t => t.text).map(t => (
              <div key={t.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ color: t.isKey ? "var(--accent)" : "var(--border)", fontWeight: 700, fontSize: "1rem", flexShrink: 0 }}>◯</span>
                <span style={{ lineHeight: 1.6 }}>{t.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 根拠 */}
      {record.evidence && (
        <div style={CSS.card}>
          <div style={{ fontFamily: "'Shippori Mincho', serif", fontWeight: 600, color: "var(--accent)", marginBottom: 8 }}>④ 根拠</div>
          <div style={{ lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{record.evidence}</div>
        </div>
      )}

      {/* 反証 */}
      {record.counterEvidence && (
        <div style={CSS.card}>
          <div style={{ fontFamily: "'Shippori Mincho', serif", fontWeight: 600, color: "var(--accent)", marginBottom: 8 }}>⑤ 反証</div>
          <div style={{ lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{record.counterEvidence}</div>
        </div>
      )}

      {/* 適応的思考 */}
      {record.adaptiveThoughts.some(t => t.text) && (
        <div style={CSS.card}>
          <div style={{ fontFamily: "'Shippori Mincho', serif", fontWeight: 600, color: "var(--accent)", marginBottom: 12 }}>⑥ 適応的思考</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {record.adaptiveThoughts.filter(t => t.text).map(t => (
              <div key={t.id} style={{ background: "var(--surface2)", borderRadius: 8, padding: "10px 14px" }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                  <span style={{ ...CSS.badge, background: "var(--accent-muted)", color: "var(--accent)" }}>
                    {t.type === "new" ? "まったく新しい考え" : "バランスの取れた考え"}
                  </span>
                  <span style={{ ...CSS.badge, background: "#e8f0e8", color: "var(--accent)" }}>確信度 {t.confidence}%</span>
                </div>
                <div style={{ lineHeight: 1.6 }}>{t.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 気分の再評価 */}
      {record.moodReEvaluation.length > 0 && (
        <div style={CSS.card}>
          <div style={{ fontFamily: "'Shippori Mincho', serif", fontWeight: 600, color: "var(--accent)", marginBottom: 12 }}>⑦ 気分の再評価</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {record.moodReEvaluation.map(r => {
              const diff = r.after - r.before;
              return (
                <div key={r.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontWeight: 700, minWidth: 70 }}>{r.name}</span>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{r.before}% →</span>
                  <span style={{ fontWeight: 700, color: "var(--accent)" }}>{r.after}%</span>
                  {diff !== 0 && (
                    <span style={{ ...CSS.badge, background: diff < 0 ? "#d4eed4" : "#fde8e0", color: diff < 0 ? "#3a7a3a" : "var(--danger)" }}>
                      {diff > 0 ? `+${diff}` : diff}%
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── CSV Utilities ─────────────────────────────────────────────────────────────
const CSV_HEADERS = [
  "id", "createdAt",
  "situation_when", "situation_where", "situation_who",
  "moods", "automaticThoughts",
  "evidence", "counterEvidence",
  "adaptiveThoughts", "moodReEvaluation"
];

function escapeCsvCell(val) {
  if (val === null || val === undefined) return "";
  const s = typeof val === "string" ? val : JSON.stringify(val);
  if (s.includes(",") || s.includes("\n") || s.includes('"')) {
    return '"' + s.replace(/"/g, '""'  ) + '"';
  }
  return s;
}

function recordsToCsv(records) {
  const header = CSV_HEADERS.join(",");
  const rows = records.map(r => [
    r.id, r.createdAt,
    r.situation.when, r.situation.where, r.situation.who,
    JSON.stringify(r.moods),
    JSON.stringify(r.automaticThoughts),
    r.evidence, r.counterEvidence,
    JSON.stringify(r.adaptiveThoughts),
    JSON.stringify(r.moodReEvaluation),
  ].map(escapeCsvCell).join(","));
  return "\uFEFF" + [header, ...rows].join("\n");
}

function parseCsvLine(line) {
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

function csvToRecords(csvText) {
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

function downloadCsv(records) {
  const csv = recordsToCsv(records);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `思考記録_${new Date().toLocaleDateString("ja-JP").replace(/\//g, "-")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Hamburger Drawer ──────────────────────────────────────────────────────────
function HamburgerMenu({ records, onExport, onImport, onClose, activeMoods, onMoodsChange }) {
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const allMoodNames = [...new Set(records.flatMap(r => r.moods.map(m => m.name)))].sort();

  function toggleMoodFilter(name) {
    onMoodsChange(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  }

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const imported = csvToRecords(ev.target.result);
        onImport(imported);
        setImportSuccess(`${imported.length}件をインポートしました`);
        setImportError("");
        setTimeout(() => { setImportSuccess(""); }, 3000);
      } catch (err) {
        setImportError("読み込みに失敗: " + err.message);
        setImportSuccess("");
      }
    };
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  }

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer">
        {/* Drawer header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontFamily: "'Shippori Mincho', serif", fontWeight: 600, color: "var(--accent)", fontSize: "1.05rem" }}>メニュー</span>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "1.3rem", color: "var(--text-muted)", padding: "2px 6px" }}>✕</button>
        </div>

        <div style={{ overflowY: "auto", flex: 1, paddingBottom: 20 }}>
          {/* CSV Export */}
          <button className="drawer-item" onClick={() => { onExport(); onClose(); }} disabled={records.length === 0}>
            <span style={{ fontSize: "1.1rem" }}>📤</span>
            <span>CSVエクスポート</span>
          </button>

          {/* CSV Import */}
          <div className="drawer-item" style={{ padding: 0 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", width: "100%", cursor: "pointer" }}>
              <span style={{ fontSize: "1.1rem" }}>📥</span>
              <span>CSVインポート</span>
              <input type="file" accept=".csv" onChange={e => { handleFile(e); }} style={{ display: "none" }} />
            </label>
          </div>

          {importSuccess && (
            <div style={{ margin: "0 16px 8px", background: "#d4eed4", color: "#3a7a3a", borderRadius: 8, padding: "8px 12px", fontSize: "0.83rem", fontWeight: 600 }}>
              ✓ {importSuccess}
            </div>
          )}
          {importError && (
            <div style={{ margin: "0 16px 8px", background: "#fde8e0", color: "var(--danger)", borderRadius: 8, padding: "8px 12px", fontSize: "0.83rem" }}>
              ⚠ {importError}
            </div>
          )}


          {/* Mood Filter */}
          {allMoodNames.length > 0 && (
            <>
              <div style={{ height: 1, background: "var(--border)", margin: "8px 0" }} />
              <div style={{ padding: "14px 20px" }}>
                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: 700, marginBottom: 10, letterSpacing: "0.04em" }}>
                  🏷 気分でフィルター
                </div>

                {/* Dropdown trigger */}
                <button
                  onClick={() => setDropdownOpen(o => !o)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 14px", background: "var(--surface2)", border: "1.5px solid var(--border)",
                    borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: "0.9rem", color: "var(--text)"
                  }}
                >
                  <span>
                    {activeMoods.length === 0
                      ? "気分を選択..."
                      : activeMoods.join("・")}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginLeft: 8 }}>
                    {dropdownOpen ? "▲" : "▼"}
                  </span>
                </button>

                {/* Dropdown list */}
                {dropdownOpen && (
                  <div style={{
                    marginTop: 4, background: "var(--surface)", border: "1.5px solid var(--border)",
                    borderRadius: 8, overflow: "hidden",
                    boxShadow: "0 4px 16px rgba(60,55,40,0.12)"
                  }}>
                    {allMoodNames.map(name => {
                      const isActive = activeMoods.includes(name);
                      return (
                        <button key={name} onClick={() => toggleMoodFilter(name)}
                          style={{
                            width: "100%", display: "flex", alignItems: "center", gap: 10,
                            padding: "10px 14px", border: "none", borderBottom: "1px solid var(--border)",
                            background: isActive ? "var(--accent-muted)" : "transparent",
                            cursor: "pointer", fontFamily: "inherit", fontSize: "0.9rem",
                            color: isActive ? "var(--accent)" : "var(--text)", textAlign: "left",
                          }}>
                          <span style={{
                            width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                            border: "2px solid", borderColor: isActive ? "var(--accent)" : "var(--border)",
                            background: isActive ? "var(--accent)" : "transparent",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "0.7rem", color: "#fff"
                          }}>
                            {isActive ? "✓" : ""}
                          </span>
                          {name}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Active filter chips + clear */}
                {activeMoods.length > 0 && (
                  <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                    {activeMoods.map(name => (
                      <span key={name} style={{ ...CSS.chip, ...CSS.chipActive, padding: "4px 10px", fontSize: "0.78rem" }}>
                        {name}
                        <button onClick={() => toggleMoodFilter(name)}
                          style={{ background: "none", border: "none", marginLeft: 4, cursor: "pointer", color: "var(--accent)", fontSize: "0.75rem", padding: 0 }}>
                          ✕
                        </button>
                      </span>
                    ))}
                    <button onClick={() => onMoodsChange([])}
                      style={{ ...CSS.btn, ...CSS.btnGhost, padding: "4px 10px", fontSize: "0.75rem" }}>
                      すべて解除
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ── Home View ─────────────────────────────────────────────────────────────────
function HomeView({ records, onNew, onSelect, activeMoods }) {
  const filtered = activeMoods.length === 0
    ? records
    : records.filter(r => activeMoods.every(name => r.moods.some(m => m.name === name)));

  return (
    <div style={{ padding: "20px", maxWidth: 640, margin: "0 auto" }}>
      <button onClick={onNew} style={{
        ...CSS.btn, ...CSS.btnPrimary,
        width: "100%", padding: "14px 20px", fontSize: "1rem",
        borderRadius: "var(--radius)", marginBottom: 12,
        boxShadow: "0 4px 16px rgba(90,122,90,0.25)",
        letterSpacing: "0.06em"
      }}>
        ＋ 新しい記録を始める
      </button>

      {/* Info links */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <a href="/about/" style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          padding: "10px 12px", borderRadius: 8,
          border: "1.5px solid var(--border)", background: "var(--surface)",
          color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 500,
          textDecoration: "none", transition: "border-color 0.15s, color 0.15s"
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}
        >
          🧠 CBTとは？
        </a>
        <a href="/cbt-note/books/" style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          padding: "10px 12px", borderRadius: 8,
          border: "1.5px solid var(--border)", background: "var(--surface)",
          color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 500,
          textDecoration: "none", transition: "border-color 0.15s, color 0.15s"
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}
        >
          📚 おすすめ書籍
        </a>
      </div>

      {records.length === 0 ? (
        <div style={{ textAlign: "center", color: "var(--text-muted)", marginTop: 60, lineHeight: 2 }}>
          <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>📖</div>
          <div style={{ fontFamily: "'Shippori Mincho', serif", fontSize: "1rem" }}>まだ記録がありません</div>
          <div style={{ fontSize: "0.85rem" }}>上のボタンから最初の記録を作ってみましょう</div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", color: "var(--text-muted)", marginTop: 40, lineHeight: 2 }}>
          <div style={{ fontSize: "2rem", marginBottom: 8 }}>🔍</div>
          <div style={{ fontSize: "0.9rem" }}>該当する記録がありません</div>
        </div>
      ) : (
        <div>
          <div style={{ ...CSS.label, marginBottom: 12, fontSize: "0.88rem" }}>
            {activeMoods.length > 0 ? `${filtered.length} / ${records.length}件` : `${records.length}件`}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.slice().reverse().map(r => {
              const s = r.situation;
              const preview = [formatWhen(s.when), s.where, s.who].filter(Boolean).join("　");
              return (
                <button key={r.id} onClick={() => onSelect(r)}
                  style={{ ...CSS.card, textAlign: "left", cursor: "pointer", border: "1px solid var(--border)", width: "100%" }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 20px rgba(60,55,40,0.14)"}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = "var(--shadow)"}
                >
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 6 }}>
                    {new Date(r.createdAt).toLocaleString("ja-JP")}
                  </div>
                  {preview && <div style={{ fontSize: "0.9rem", fontWeight: 500, marginBottom: 8 }}>{preview}</div>}
                  {r.moods.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {r.moods.map(m => (
                        <span key={m.name} style={{
                          ...CSS.chip,
                          ...(activeMoods.includes(m.name) ? CSS.chipActive : {}),
                          padding: "3px 10px", fontSize: "0.78rem",
                          fontWeight: activeMoods.includes(m.name) ? 700 : 500,
                        }}>
                          {m.name} {m.level}%
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
const STEP_LABELS = ["状況", "気分", "自動思考", "根拠", "反証", "適応的思考", "再評価"];

export default function App() {
  const [view, setView] = useState("home");
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(getInitialForm());
  const [records, setRecords] = useState([]);
  const [customMoods, setCustomMoods] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeMoods, setActiveMoods] = useState([]);

  // Load from storage
  useEffect(() => {
    try {
      const r = localStorage.getItem("cbt_records");
      if (r) setRecords(JSON.parse(r));
    } catch (_) {}
    try {
      const m = localStorage.getItem("cbt_custom_moods");
      if (m) setCustomMoods(JSON.parse(m));
    } catch (_) {}
    setLoaded(true);
  }, []);

  // Persist records
  function saveRecord(newRecord) {
    const updated = [...records, newRecord];
    setRecords(updated);
    try { localStorage.setItem("cbt_records", JSON.stringify(updated)); } catch (_) {}
  }

  function deleteRecord(id) {
    const updated = records.filter(r => r.id !== id);
    setRecords(updated);
    try { localStorage.setItem("cbt_records", JSON.stringify(updated)); } catch (_) {}
    setView("home");
    setSelectedRecord(null);
  }

  // Persist custom moods
  const saveCustomMoods = useCallback((moods) => {
    setCustomMoods(moods);
    try { localStorage.setItem("cbt_custom_moods", JSON.stringify(moods)); } catch (_) {}
  }, []);

  function startNew() {
    setForm(getInitialForm());
    setStep(0);
    setView("new");
  }

  function handleSave() {
    const record = { id: genId(), createdAt: new Date().toISOString(), ...form };
    saveRecord(record);
    setView("home");
  }

  function handleExport() {
    downloadCsv(records);
  }

  function handleImport(imported) {
    const existingIds = new Set(records.map(r => r.id));
    const newOnes = imported.filter(r => !existingIds.has(r.id));
    const merged = [...records, ...newOnes];
    setRecords(merged);
    try { localStorage.setItem("cbt_records", JSON.stringify(merged)); } catch (_) {}
  }

  const totalSteps = STEP_LABELS.length;
  const progress = ((step + 1) / totalSteps) * 100;

  if (!loaded) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "var(--text-muted)" }}>読み込み中...</div>;

  return (
    <>
      <FontStyle />
      <div style={CSS.app}>
        {/* Header */}
        <div style={CSS.header}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {(view === "new" || view === "detail") && (
              <button onClick={() => setView("home")} style={{ background: "none", border: "none", fontSize: "1.2rem", color: "var(--text-muted)", padding: "0 4px" }}>←</button>
            )}
            <a href="/" style={{ ...CSS.headerTitle, textDecoration: "none" }}>思考記録</a>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {view === "new" && (
              <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                {step + 1} / {totalSteps}　{STEP_LABELS[step]}
              </span>
            )}
            <button
              onClick={() => setMenuOpen(true)}
              style={{ background: "none", border: "none", padding: "6px 8px", display: "flex", flexDirection: "column", gap: "5px", cursor: "pointer", position: "relative" }}
              aria-label="メニューを開く"
            >
              {[0,1,2].map(i => (
                <span key={i} style={{ display: "block", width: 22, height: 2, background: activeMoods.length > 0 ? "var(--accent)" : "var(--text-muted)", borderRadius: 2 }} />
              ))}
              {activeMoods.length > 0 && (
                <span style={{
                  position: "absolute", top: 2, right: 2,
                  background: "var(--accent)", color: "#fff",
                  borderRadius: "50%", width: 16, height: 16,
                  fontSize: "0.65rem", fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>{activeMoods.length}</span>
              )}
            </button>
          </div>
        </div>

        {/* Progress bar (wizard only) */}
        {view === "new" && (
          <div style={{ height: 3, background: "var(--border)" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: "var(--accent)", transition: "width 0.3s ease" }} />
          </div>
        )}

        {/* Content */}
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          {view === "home" && (
            <HomeView records={records} onNew={startNew} onSelect={r => { setSelectedRecord(r); setView("detail"); }} activeMoods={activeMoods} />
          )}
          {view === "new" && (
            <div style={{ padding: "20px 20px 80px" }}>
              {step === 0 && <Step0 data={form} setData={setForm} />}
              {step === 1 && <Step1 data={form} setData={setForm} customMoods={customMoods} setCustomMoods={saveCustomMoods} />}
              {step === 2 && <Step2 data={form} setData={setForm} />}
              {step === 3 && <Step3 data={form} setData={setForm} />}
              {step === 4 && <Step4 data={form} setData={setForm} />}
              {step === 5 && <Step5 data={form} setData={setForm} />}
              {step === 6 && <Step6 data={form} setData={setForm} />}
            </div>
          )}
          {view === "detail" && selectedRecord && (
            <RecordDetail record={selectedRecord} onBack={() => setView("home")} onDelete={() => deleteRecord(selectedRecord.id)} />
          )}
        </div>

        {/* Float bar (wizard only) */}
        {view === "new" && (
          <div style={CSS.floatBar}>
            <button onClick={() => step === 0 ? setView("home") : setStep(s => s - 1)}
              style={{ ...CSS.btn, ...CSS.btnGhost }}>
              {step === 0 ? "キャンセル" : "← 戻る"}
            </button>
            {step < totalSteps - 1
              ? <button onClick={() => setStep(s => s + 1)} style={{ ...CSS.btn, ...CSS.btnPrimary }}>次へ →</button>
              : <button onClick={handleSave} style={{ ...CSS.btn, ...CSS.btnPrimary, background: "var(--accent)" }}>💾 保存する</button>
            }
          </div>
        )}

        {/* Hamburger Drawer */}
        {menuOpen && (
          <HamburgerMenu
            records={records}
            onExport={handleExport}
            onImport={handleImport}
            onClose={() => setMenuOpen(false)}
            activeMoods={activeMoods}
            onMoodsChange={setActiveMoods}
          />
        )}
      </div>
    </>
  );
}