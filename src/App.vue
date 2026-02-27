<script setup>
import { ref, computed, watch, onMounted } from "vue";
import './App.css';

// ── Constants & Helpers ───────────────────────────────────────────────────────
const DEFAULT_MOODS = ["不安", "無力感", "怒り", "悲しみ", "恥", "罪悪感", "孤独", "恐怖", "混乱", "落ち込み", "イライラ", "焦り"];
const STEP_LABELS = ["状況", "気分", "自動思考", "根拠", "反証", "適応的思考", "再評価"];

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

// ── State ─────────────────────────────────────────────────────────────────────
const view = ref("home");
const step = ref(0);
const form = ref(getInitialForm());
const records = ref([]);
const customMoods = ref([]);
const selectedRecord = ref(null);
const loaded = ref(false);
const menuOpen = ref(false);
const activeMoods = ref([]);

// Step 1 specific
const newMood = ref("");

// Menu specific
const importError = ref("");
const importSuccess = ref("");
const dropdownOpen = ref(false);

// ── Computed ──────────────────────────────────────────────────────────────────
const totalSteps = STEP_LABELS.length;
const progress = computed(() => ((step.value + 1) / totalSteps) * 100);

const allMoods = computed(() => [...DEFAULT_MOODS, ...customMoods.value]);
const selectedMoodNames = computed(() => form.value.moods.map(m => m.name));

const keyThoughts = computed(() => form.value.automaticThoughts.filter(t => t.isKey && t.text));

const allMoodNamesInRecords = computed(() => {
  return [...new Set(records.value.flatMap(r => r.moods.map(m => m.name)))].sort();
});

const filteredRecords = computed(() => {
  if (activeMoods.value.length === 0) return records.value;
  return records.value.filter(r => activeMoods.value.every(name => r.moods.some(m => m.name === name)));
});

// ── Lifecycle & Storage ───────────────────────────────────────────────────────
onMounted(() => {
  try {
    const r = localStorage.getItem("cbt_records");
    if (r) records.value = JSON.parse(r);
  } catch (_) {}
  try {
    const m = localStorage.getItem("cbt_custom_moods");
    if (m) customMoods.value = JSON.parse(m);
  } catch (_) {}
  loaded.value = true;
});

function saveRecordsToStorage(updated) {
  records.value = updated;
  try { localStorage.setItem("cbt_records", JSON.stringify(updated)); } catch (_) {}
}

function saveCustomMoodsToStorage(updated) {
  customMoods.value = updated;
  try { localStorage.setItem("cbt_custom_moods", JSON.stringify(updated)); } catch (_) {}
}

// ── Actions ───────────────────────────────────────────────────────────────────
function startNew() {
  form.value = getInitialForm();
  step.value = 0;
  view.value = "new";
}

function handleSave() {
  const record = { id: genId(), createdAt: new Date().toISOString(), ...JSON.parse(JSON.stringify(form.value)) };
  saveRecordsToStorage([...records.value, record]);
  view.value = "home";
}

function deleteRecord(id) {
  saveRecordsToStorage(records.value.filter(r => r.id !== id));
  view.value = "home";
  selectedRecord.value = null;
}

// Step 1 Actions
function toggleMood(name) {
  const exists = form.value.moods.find(m => m.name === name);
  if (exists) {
    form.value.moods = form.value.moods.filter(m => m.name !== name);
  } else {
    form.value.moods.push({ name, level: 50 });
  }
}

function setMoodLevel(name, level) {
  const m = form.value.moods.find(m => m.name === name);
  if (m) m.level = level;
}

function addCustomMood() {
  const t = newMood.value.trim();
  if (!t || allMoods.value.includes(t)) return;
  saveCustomMoodsToStorage([...customMoods.value, t]);
  newMood.value = "";
  toggleMood(t);
}

// Step 2 Actions
function addAutomaticThought() {
  form.value.automaticThoughts.push({ id: genId(), text: "", isKey: false });
}
function removeAutomaticThought(id) {
  form.value.automaticThoughts = form.value.automaticThoughts.filter(t => t.id !== id);
}

// Step 5 Actions
function addAdaptiveThought() {
  form.value.adaptiveThoughts.push({ id: genId(), text: "", type: "balanced", confidence: 50 });
}
function removeAdaptiveThought(id) {
  form.value.adaptiveThoughts = form.value.adaptiveThoughts.filter(t => t.id !== id);
}

// Step 6 Logic
watch(step, (newStep) => {
  if (newStep === 6) {
    // Initialize re-evaluation
    const reEval = form.value.moods.map(m => {
      const existing = form.value.moodReEvaluation.find(r => r.name === m.name);
      return existing || { name: m.name, before: m.level, after: m.level };
    });
    form.value.moodReEvaluation = reEval;
  }
});

function setReEvalAfter(name, after) {
  const r = form.value.moodReEvaluation.find(r => r.name === name);
  if (r) r.after = after;
}

// CSV Utilities
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

function handleExport() {
  const header = CSV_HEADERS.join(",");
  const rows = records.value.map(r => [
    r.id, r.createdAt,
    r.situation.when, r.situation.where, r.situation.who,
    JSON.stringify(r.moods),
    JSON.stringify(r.automaticThoughts),
    r.evidence, r.counterEvidence,
    JSON.stringify(r.adaptiveThoughts),
    JSON.stringify(r.moodReEvaluation),
  ].map(escapeCsvCell).join(","));
  const csv = "\uFEFF" + [header, ...rows].join("\n");
  
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `思考記録_${new Date().toLocaleDateString("ja-JP").replace(/\//g, "-")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  menuOpen.value = false;
}

function handleImportFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const imported = csvToRecords(ev.target.result);
      const existingIds = new Set(records.value.map(r => r.id));
      const newOnes = imported.filter(r => !existingIds.has(r.id));
      saveRecordsToStorage([...records.value, ...newOnes]);
      
      importSuccess.value = `${imported.length}件をインポートしました`;
      importError.value = "";
      setTimeout(() => { importSuccess.value = ""; }, 3000);
    } catch (err) {
      importError.value = "読み込みに失敗: " + err.message;
      importSuccess.value = "";
    }
  };
  reader.readAsText(file, "UTF-8");
  e.target.value = "";
}

function toggleMoodFilter(name) {
  if (activeMoods.value.includes(name)) {
    activeMoods.value = activeMoods.value.filter(n => n !== name);
  } else {
    activeMoods.value.push(name);
  }
}
</script>

<template>
  <div v-if="!loaded" style="display: flex; align-items: center; justify-content: center; height: 100vh; color: var(--text-muted)">
    読み込み中...
  </div>

  <div v-else class="app">
    <!-- Header -->
    <div class="header">
      <div style="display: flex; align-items: center; gap: 10px">
        <button v-if="view === 'new' || view === 'detail'" @click="view = 'home'" style="background: none; border: none; fontSize: 1.2rem; color: var(--text-muted); padding: 0 4px">←</button>
        <a href="/cbt-note/" class="header-title" style="text-decoration: none">思考記録</a>
      </div>
      <div style="display: flex; align-items: center; gap: 10px">
        <span v-if="view === 'new'" style="font-size: 0.82rem; color: var(--text-muted)">
          {{ step + 1 }} / {{ totalSteps }}　{{ STEP_LABELS[step] }}
        </span>
        <button
          @click="menuOpen = true"
          style="background: none; border: none; padding: 6px 8px; display: flex; flex-direction: column; gap: 5px; cursor: pointer; position: relative"
          aria-label="メニューを開く"
        >
          <span v-for="i in 3" :key="i" :style="{ display: 'block', width: '22px', height: '2px', background: activeMoods.length > 0 ? 'var(--accent)' : 'var(--text-muted)', borderRadius: '2px' }"></span>
          <span v-if="activeMoods.length > 0" style="position: absolute; top: 2px; right: 2px; background: var(--accent); color: #fff; border-radius: 50%; width: 16px; height: 16px; font-size: 0.65rem; font-weight: 700; display: flex; align-items: center; justify-content: center">
            {{ activeMoods.length }}
          </span>
        </button>
      </div>
    </div>

    <!-- Progress bar -->
    <div v-if="view === 'new'" style="height: 3px; background: var(--border)">
      <div :style="{ height: '100%', width: `${progress}%`, background: 'var(--accent)', transition: 'width 0.3s ease' }"></div>
    </div>

    <!-- Content -->
    <div style="max-width: 640px; margin: 0 auto; padding: 20px; padding-bottom: 80px;">
      
      <!-- HOME VIEW -->
      <div v-if="view === 'home'">
        <button @click="startNew" class="btn btn-primary" style="width: 100%; padding: 14px 20px; font-size: 1rem; border-radius: var(--radius); margin-bottom: 12px; box-shadow: 0 4px 16px rgba(90,122,90,0.25); letter-spacing: 0.06em">
          ＋ 新しい記録を始める
        </button>

        <div style="display: flex; gap: 8px; margin-bottom: 24px">
          <a href="/cbt-note/about/" class="info-link">🧠 CBTとは？</a>
          <a href="/cbt-note/books/" class="info-link">📚 おすすめ書籍</a>
        </div>

        <div v-if="records.length === 0" style="text-align: center; color: var(--text-muted); margin-top: 60px; line-height: 2">
          <div style="font-size: 2.5rem; margin-bottom: 12px">📖</div>
          <div style="font-family: 'Shippori Mincho', serif; font-size: 1rem">まだ記録がありません</div>
          <div style="font-size: 0.85rem">上のボタンから最初の記録を作ってみましょう</div>
        </div>
        <div v-else-if="filteredRecords.length === 0" style="text-align: center; color: var(--text-muted); margin-top: 40px; line-height: 2">
          <div style="font-size: 2rem; margin-bottom: 8px">🔍</div>
          <div style="font-size: 0.9rem">該当する記録がありません</div>
        </div>
        <div v-else>
          <div class="lbl" style="margin-bottom: 12px; font-size: 0.88rem">
            {{ activeMoods.length > 0 ? `${filteredRecords.length} / ${records.length}件` : `${records.length}件` }}
          </div>
          <div style="display: flex; flex-direction: column; gap: 10px">
            <button v-for="r in filteredRecords.slice().reverse()" :key="r.id" @click="selectedRecord = r; view = 'detail'"
              class="card record-card"
            >
              <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 6px">
                {{ new Date(r.createdAt).toLocaleString("ja-JP") }}
              </div>
              <div v-if="r.situation.when || r.situation.where || r.situation.who" style="font-size: 0.9rem; font-weight: 500; margin-bottom: 8px">
                {{ [formatWhen(r.situation.when), r.situation.where, r.situation.who].filter(Boolean).join("　") }}
              </div>
              <div v-if="r.moods.length > 0" style="display: flex; flex-wrap: wrap; gap: 6px">
                <span v-for="m in r.moods" :key="m.name"
                  class="chip" :class="{ 'chip-active': activeMoods.includes(m.name) }"
                  style="padding: 3px 10px; font-size: 0.78rem"
                  :style="{ fontWeight: activeMoods.includes(m.name) ? 700 : 500 }"
                >
                  {{ m.name }} {{ m.level }}%
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- WIZARD STEPS -->
      <div v-if="view === 'new'">
        <!-- Step 0: 状況 -->
        <div v-if="step === 0" class="slide-in">
          <div class="step-title">① 状況</div>
          <div class="step-sub">記録する出来事の状況を書き留めましょう。</div>
          
          <div class="field-group">
            <label class="lbl">📅 いつ</label>
            <input type="datetime-local" v-model="form.situation.when" class="inp" style="display: block; border: 1.5px solid var(--border); color-scheme: light; cursor: pointer" />
          </div>
          <div class="field-group">
            <label class="lbl">📍 どこで</label>
            <input type="text" v-model="form.situation.where" placeholder="例：職場の会議室" class="inp" style="display: block; border: 1.5px solid var(--border)" />
          </div>
          <div class="field-group">
            <label class="lbl">👤 だれが</label>
            <input type="text" v-model="form.situation.who" placeholder="例：上司と二人で話していたとき" class="inp" style="display: block; border: 1.5px solid var(--border)" />
          </div>
        </div>

        <!-- Step 1: 気分 -->
        <div v-else-if="step === 1" class="slide-in">
          <div class="step-title">② 気分</div>
          <div class="step-sub">今どんな気分ですか？当てはまるものを選んでください。複数選択できます。</div>

          <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px">
            <button v-for="name in allMoods" :key="name" @click="toggleMood(name)"
              class="chip" :class="{ 'chip-active': selectedMoodNames.includes(name) }"
              style="position: relative"
            >
              <span v-if="customMoods.includes(name)" style="font-size: 0.65rem; opacity: 0.6">＊</span>
              {{ name }}
              <span v-if="selectedMoodNames.includes(name)" style="margin-left: 2px">✓</span>
            </button>
          </div>

          <div style="display: flex; gap: 8px; margin-bottom: 20px">
            <input v-model="newMood" @keydown.enter="addCustomMood" placeholder="気分を追加..." class="inp" style="flex: 1; border: 1.5px solid var(--border)" />
            <button @click="addCustomMood" class="btn btn-primary btn-small">追加</button>
          </div>

          <div v-if="form.moods.length > 0">
            <div class="divider"></div>
            <div class="lbl" style="margin-bottom: 12px">選んだ気分のレベルを設定してください</div>
            <div style="display: flex; flex-direction: column; gap: 14px">
              <div v-for="m in form.moods" :key="m.name" style="background: var(--accent-muted); border-radius: 8px; padding: 12px 14px">
                <div style="font-weight: 700; color: var(--accent); margin-bottom: 8px; font-size: 0.95rem">{{ m.name }}</div>
                <div style="display: flex; align-items: center; gap: 12px">
                  <input type="range" min="0" max="100" v-model.number="m.level" class="slider" />
                  <span style="min-width: 44px; text-align: right; font-weight: 700; color: var(--accent); font-size: 1rem">{{ m.level }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 2: 自動思考 -->
        <div v-else-if="step === 2" class="slide-in">
          <div class="step-title">③ 自動思考</div>
          <div class="step-sub">気分を感じた直前に、頭の中に何が浮かんだか書いてください。<br />気分につながる主な考えには ◯ を付けましょう。</div>

          <div style="display: flex; flex-direction: column; gap: 12px">
            <div v-for="(t, i) in form.automaticThoughts" :key="t.id" class="card" style="padding: 14px; margin-bottom: 0; position: relative">
              <div style="display: flex; gap: 10px; align-items: flex-start">
                <button @click="t.isKey = !t.isKey" title="気分につながる考えに印をつける"
                  :style="{
                    width: '36px', height: '36px', borderRadius: '50%', border: '2px solid',
                    borderColor: t.isKey ? 'var(--accent)' : 'var(--border)',
                    background: t.isKey ? 'var(--accent-muted)' : 'var(--surface2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1rem', color: t.isKey ? 'var(--accent)' : 'var(--border)',
                    fontWeight: 700, flexShrink: 0, marginTop: '2px'
                  }"
                >
                  ◯
                </button>
                <div style="flex: 1">
                  <textarea v-model="t.text" :placeholder="`思考 ${i + 1}：頭に浮かんだこと、イメージなど`" rows="2" class="txta" style="min-height: 60px; border: 1.5px solid var(--border)"></textarea>
                </div>
                <button v-if="form.automaticThoughts.length > 1" @click="removeAutomaticThought(t.id)" style="background: none; border: none; color: var(--text-muted); font-size: 1.1rem; padding: 4px; flex-shrink: 0">✕</button>
              </div>
              <div v-if="t.isKey" style="font-size: 0.75rem; color: var(--accent); margin-top: 6px; margin-left: 46px; font-weight: 600">◯ 気分につながる考え</div>
            </div>
          </div>
          <button @click="addAutomaticThought" class="btn btn-ghost" style="width: 100%; margin-top: 12px; border: 1.5px dashed var(--border)">＋ 思考を追加</button>
        </div>

        <!-- Step 3: 根拠 -->
        <div v-else-if="step === 3" class="slide-in">
          <div class="step-title">④ 根拠</div>
          <div class="step-sub">自動思考を裏付ける事実を書いてください。<br />「〜だから○○と思う」という客観的な事実を探しましょう。</div>
          <div v-if="keyThoughts.length > 0" style="background: var(--accent-muted); border-radius: 8px; padding: 10px 14px; margin-bottom: 16px">
            <div style="font-size: 0.78rem; color: var(--accent); font-weight: 700; margin-bottom: 6px">◯ 気分につながる考え</div>
            <div v-for="t in keyThoughts" :key="t.id" style="font-size: 0.88rem; line-height: 1.5; color: var(--text)">・{{ t.text }}</div>
          </div>
          <textarea v-model="form.evidence" placeholder="例：上司がため息をついた。報告書に赤字が多かった。期末評価が下がった。" rows="5" class="txta" style="display: block; border: 1.5px solid var(--border)"></textarea>
        </div>

        <!-- Step 4: 反証 -->
        <div v-else-if="step === 4" class="slide-in">
          <div class="step-title">⑤ 反証</div>
          <div class="step-sub">自動思考と矛盾する事実を書いてください。<br />「○○だけど、△△という事実もある」という視点で。</div>
          <div v-if="keyThoughts.length > 0" style="background: var(--surface2); border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; border: 1px solid var(--border)">
            <div style="font-size: 0.78rem; color: var(--text-muted); font-weight: 700; margin-bottom: 6px">◯ 気分につながる考え</div>
            <div v-for="t in keyThoughts" :key="t.id" style="font-size: 0.88rem; line-height: 1.5; color: var(--text)">・{{ t.text }}</div>
          </div>
          <textarea v-model="form.counterEvidence" placeholder="例：以前のプロジェクトは褒められた。上司は今日体調が悪そうだった。同僚は気にしていなかった。" rows="5" class="txta" style="display: block; border: 1.5px solid var(--border)"></textarea>
        </div>

        <!-- Step 5: 適応的思考 -->
        <div v-else-if="step === 5" class="slide-in">
          <div class="step-title">⑥ 適応的思考</div>
          <div class="step-sub">根拠と反証を踏まえて、より現実的・バランスの取れた考えを書きましょう。<br />どの程度確信できるかも評価してください。</div>
          <div style="display: flex; flex-direction: column; gap: 14px">
            <div v-for="(t, i) in form.adaptiveThoughts" :key="t.id" class="card" style="margin-bottom: 0">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px">
                <span style="font-weight: 700; font-size: 0.85rem; color: var(--text-muted)">思考 {{ i + 1 }}</span>
                <div style="display: flex; gap: 8px; align-items: center">
                  <button @click="t.type = 'new'" class="btn btn-small" :class="t.type === 'new' ? 'btn-primary' : 'btn-ghost'">まったく新しい考え</button>
                  <button @click="t.type = 'balanced'" class="btn btn-small" :class="t.type === 'balanced' ? 'btn-primary' : 'btn-ghost'">バランスの取れた考え</button>
                  <button v-if="form.adaptiveThoughts.length > 1" @click="removeAdaptiveThought(t.id)" style="background: none; border: none; color: var(--text-muted); font-size: 1rem">✕</button>
                </div>
              </div>
              <textarea v-model="t.text" :placeholder="t.type === 'new' ? 'まったく別の視点から考えると...' : '根拠と反証を合わせて考えると...'" rows="3" class="txta" style="margin-bottom: 12px; border: 1.5px solid var(--border)"></textarea>
              <div>
                <label class="lbl">この考えをどの程度確信できますか？</label>
                <div style="display: flex; align-items: center; gap: 12px">
                  <input type="range" min="0" max="100" v-model.number="t.confidence" class="slider" />
                  <span style="min-width: 44px; text-align: right; font-weight: 700; color: var(--accent); font-size: 1rem">{{ t.confidence }}%</span>
                </div>
              </div>
            </div>
          </div>
          <button @click="addAdaptiveThought" class="btn btn-ghost" style="width: 100%; margin-top: 12px; border: 1.5px dashed var(--border)">＋ 思考を追加</button>
        </div>

        <!-- Step 6: 再評価 -->
        <div v-else-if="step === 6" class="slide-in">
          <div class="step-title">⑦ 気分の再評価</div>
          <div v-if="form.moods.length === 0" style="color: var(--text-muted); margin-top: 20px">② 気分の欄で気分が選択されていません。</div>
          <div v-else>
            <div class="step-sub">適応的思考を経て、今の気分レベルを改めて評価してください。</div>
            <div style="display: flex; flex-direction: column; gap: 14px">
              <div v-for="r in form.moodReEvaluation" :key="r.name" class="card" style="margin-bottom: 0">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px">
                  <span style="font-weight: 700; font-size: 1rem; color: var(--accent)">{{ r.name }}</span>
                  <div style="display: flex; gap: 8px; align-items: center">
                    <span style="font-size: 0.8rem; color: var(--text-muted)">最初：{{ r.before }}%</span>
                    <span v-if="r.after - r.before !== 0" class="badge" :style="{
                      background: (r.after - r.before) < 0 ? '#d4eed4' : '#fde8e0',
                      color: (r.after - r.before) < 0 ? '#3a7a3a' : 'var(--danger)'
                    }">
                      {{ (r.after - r.before) > 0 ? `+${r.after - r.before}` : (r.after - r.before) }}%
                    </span>
                  </div>
                </div>
                <div>
                  <label class="lbl">今の{{ r.name }}のレベル</label>
                  <div style="display: flex; align-items: center; gap: 12px">
                    <input type="range" min="0" max="100" v-model.number="r.after" class="slider" />
                    <span style="min-width: 44px; text-align: right; font-weight: 700; color: var(--accent); font-size: 1rem">{{ r.after }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- DETAIL VIEW -->
      <div v-if="view === 'detail' && selectedRecord">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px">
          <button @click="view = 'home'" class="btn btn-ghost btn-small">← 戻る</button>
          <span style="color: var(--text-muted); font-size: 0.82rem">{{ new Date(selectedRecord.createdAt).toLocaleString("ja-JP") }}</span>
          <button @click="deleteRecord(selectedRecord.id)" class="btn btn-danger" style="margin-left: auto">削除</button>
        </div>

        <div class="card">
          <div class="detail-section-title">① 状況</div>
          <div style="display: flex; flex-direction: column; gap: 6px">
            <div v-if="selectedRecord.situation.when"><span class="detail-label">📅 いつ　　</span>{{ formatWhen(selectedRecord.situation.when) }}</div>
            <div v-if="selectedRecord.situation.where"><span class="detail-label">📍 どこで　</span>{{ selectedRecord.situation.where }}</div>
            <div v-if="selectedRecord.situation.who"><span class="detail-label">👤 だれが　</span>{{ selectedRecord.situation.who }}</div>
          </div>
        </div>

        <div v-if="selectedRecord.moods.length > 0" class="card">
          <div class="detail-section-title">② 気分</div>
          <div style="display: flex; flex-wrap: wrap; gap: 8px">
            <div v-for="m in selectedRecord.moods" :key="m.name" class="chip chip-active">
              {{ m.name }} <strong>{{ m.level }}%</strong>
            </div>
          </div>
        </div>

        <div v-if="selectedRecord.automaticThoughts.some(t => t.text)" class="card">
          <div class="detail-section-title">③ 自動思考</div>
          <div style="display: flex; flex-direction: column; gap: 8px">
            <div v-for="t in selectedRecord.automaticThoughts.filter(t => t.text)" :key="t.id" style="display: flex; gap: 10px; align-items: flex-start">
              <span :style="{ color: t.isKey ? 'var(--accent)' : 'var(--border)', fontWeight: 700, fontSize: '1rem', flexShrink: 0 }">◯</span>
              <span style="line-height: 1.6">{{ t.text }}</span>
            </div>
          </div>
        </div>

        <div v-if="selectedRecord.evidence" class="card">
          <div class="detail-section-title">④ 根拠</div>
          <div style="line-height: 1.7; white-space: pre-wrap">{{ selectedRecord.evidence }}</div>
        </div>

        <div v-if="selectedRecord.counterEvidence" class="card">
          <div class="detail-section-title">⑤ 反証</div>
          <div style="line-height: 1.7; white-space: pre-wrap">{{ selectedRecord.counterEvidence }}</div>
        </div>

        <div v-if="selectedRecord.adaptiveThoughts.some(t => t.text)" class="card">
          <div class="detail-section-title">⑥ 適応的思考</div>
          <div style="display: flex; flex-direction: column; gap: 10px">
            <div v-for="t in selectedRecord.adaptiveThoughts.filter(t => t.text)" :key="t.id" style="background: var(--surface2); border-radius: 8px; padding: 10px 14px">
              <div style="display: flex; gap: 8px; margin-bottom: 6px">
                <span class="badge" style="background: var(--accent-muted); color: var(--accent)">
                  {{ t.type === "new" ? "まったく新しい考え" : "バランスの取れた考え" }}
                </span>
                <span class="badge" style="background: #e8f0e8; color: var(--accent)">確信度 {{ t.confidence }}%</span>
              </div>
              <div style="line-height: 1.6">{{ t.text }}</div>
            </div>
          </div>
        </div>

        <div v-if="selectedRecord.moodReEvaluation.length > 0" class="card">
          <div class="detail-section-title">⑦ 気分の再評価</div>
          <div style="display: flex; flex-direction: column; gap: 8px">
            <div v-for="r in selectedRecord.moodReEvaluation" :key="r.name" style="display: flex; align-items: center; gap: 10px">
              <span style="font-weight: 700; min-width: 70px">{{ r.name }}</span>
              <span style="color: var(--text-muted); font-size: 0.85rem">{{ r.before }}% →</span>
              <span style="font-weight: 700; color: var(--accent)">{{ r.after }}%</span>
              <span v-if="r.after - r.before !== 0" class="badge" :style="{ background: (r.after - r.before) < 0 ? '#d4eed4' : '#fde8e0', color: (r.after - r.before) < 0 ? '#3a7a3a' : 'var(--danger)' }">
                {{ (r.after - r.before) > 0 ? `+${r.after - r.before}` : (r.after - r.before) }}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Float bar -->
    <div v-if="view === 'new'" class="float-bar">
      <button @click="step === 0 ? (view = 'home') : step--" class="btn btn-ghost">
        {{ step === 0 ? "キャンセル" : "← 戻る" }}
      </button>
      <button v-if="step < totalSteps - 1" @click="step++" class="btn btn-primary">次へ →</button>
      <button v-else @click="handleSave" class="btn btn-primary" style="background: var(--accent)">💾 保存する</button>
    </div>

    <!-- Hamburger Drawer -->
    <div v-if="menuOpen">
      <div class="drawer-overlay" @click="menuOpen = false"></div>
      <div class="drawer">
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--border)">
          <span style="font-family: 'Shippori Mincho', serif; font-weight: 600; color: var(--accent); font-size: 1.05rem">メニュー</span>
          <button @click="menuOpen = false" style="background: none; border: none; font-size: 1.3rem; color: var(--text-muted); padding: 2px 6px">✕</button>
        </div>
        <div style="overflow-y: auto; flex: 1; padding-bottom: 20px">
          <button class="drawer-item" @click="handleExport" :disabled="records.length === 0">
            <span style="font-size: 1.1rem">📤</span>
            <span>CSVエクスポート</span>
          </button>
          <div class="drawer-item" style="padding: 0">
            <label style="display: flex; align-items: center; gap: 12px; padding: 14px 20px; width: 100%; cursor: pointer">
              <span style="font-size: 1.1rem">📥</span>
              <span>CSVインポート</span>
              <input type="file" accept=".csv" @change="handleImportFile" style="display: none" />
            </label>
          </div>
          <div v-if="importSuccess" style="margin: 0 16px 8px; background: #d4eed4; color: #3a7a3a; border-radius: 8px; padding: 8px 12px; font-size: 0.83rem; font-weight: 600">
            ✓ {{ importSuccess }}
          </div>
          <div v-if="importError" style="margin: 0 16px 8px; background: #fde8e0; color: var(--danger); border-radius: 8px; padding: 8px 12px; font-size: 0.83rem">
            ⚠ {{ importError }}
          </div>

          <div v-if="allMoodNamesInRecords.length > 0">
            <div style="height: 1px; background: var(--border); margin: 8px 0"></div>
            <div style="padding: 14px 20px">
              <div style="font-size: 0.82rem; color: var(--text-muted); font-weight: 700; margin-bottom: 10px; letter-spacing: 0.04em">
                🏷 気分でフィルター
              </div>
              <button @click="dropdownOpen = !dropdownOpen" style="width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: var(--surface2); border: 1.5px solid var(--border); border-radius: 8px; cursor: pointer; font-family: inherit; font-size: 0.9rem; color: var(--text)">
                <span>{{ activeMoods.length === 0 ? "気分を選択..." : activeMoods.join("・") }}</span>
                <span style="font-size: 0.75rem; color: var(--text-muted); margin-left: 8px">{{ dropdownOpen ? "▲" : "▼" }}</span>
              </button>
              <div v-if="dropdownOpen" style="margin-top: 4px; background: var(--surface); border: 1.5px solid var(--border); border-radius: 8px; overflow: hidden; box-shadow: 0 4px 16px rgba(60,55,40,0.12)">
                <button v-for="name in allMoodNamesInRecords" :key="name" @click="toggleMoodFilter(name)"
                  style="width: 100%; display: flex; align-items: center; gap: 10px; padding: 10px 14px; border: none; border-bottom: 1px solid var(--border); cursor: pointer; font-family: inherit; font-size: 0.9rem; text-align: left"
                  :style="{ background: activeMoods.includes(name) ? 'var(--accent-muted)' : 'transparent', color: activeMoods.includes(name) ? 'var(--accent)' : 'var(--text)' }"
                >
                  <span :style="{
                    width: '18px', height: '18px', borderRadius: '4px', flexShrink: 0,
                    border: '2px solid', borderColor: activeMoods.includes(name) ? 'var(--accent)' : 'var(--border)',
                    background: activeMoods.includes(name) ? 'var(--accent)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', color: '#fff'
                  }">
                    {{ activeMoods.includes(name) ? "✓" : "" }}
                  </span>
                  {{ name }}
                </button>
              </div>
              <div v-if="activeMoods.length > 0" style="margin-top: 10px; display: flex; flex-wrap: wrap; gap: 6px; align-items: center">
                <span v-for="name in activeMoods" :key="name" class="chip chip-active" style="padding: 4px 10px; font-size: 0.78rem">
                  {{ name }}
                  <button @click="toggleMoodFilter(name)" style="background: none; border: none; margin-left: 4px; cursor: pointer; color: var(--accent); font-size: 0.75rem; padding: 0">✕</button>
                </span>
                <button @click="activeMoods = []" class="btn btn-ghost" style="padding: 4px 10px; font-size: 0.75rem">すべて解除</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>