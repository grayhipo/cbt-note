<script setup>
import { ref, computed, watch } from 'vue';
import { genId } from '../utils';

const STEP_LABELS = ["状況", "気分", "自動思考", "根拠", "反証", "適応的思考", "再評価"];

const props = defineProps({
  step: { type: Number, required: true },
  form: { type: Object, required: true },
  allMoods: { type: Array, required: true },
  customMoods: { type: Array, required: true }
});

const emit = defineEmits(['update:step', 'save', 'cancel', 'addCustomMood']);

const newMood = ref("");

const totalSteps = STEP_LABELS.length;
const progress = computed(() => ((props.step + 1) / totalSteps) * 100);
const selectedMoodNames = computed(() => props.form.moods.map(m => m.name));
const keyThoughts = computed(() => props.form.automaticThoughts.filter(t => t.isKey && t.text));

// Step 1 Actions
function toggleMood(name) {
  const exists = props.form.moods.find(m => m.name === name);
  if (exists) {
    props.form.moods = props.form.moods.filter(m => m.name !== name);
  } else {
    props.form.moods.push({ name, level: 50 });
  }
}

function handleAddCustomMood() {
  const t = newMood.value.trim();
  if (!t) return;
  emit('addCustomMood', t);
  newMood.value = "";
}

// Step 2 Actions
function addAutomaticThought() {
  props.form.automaticThoughts.push({ id: genId(), text: "", isKey: false });
}
function removeAutomaticThought(id) {
  props.form.automaticThoughts = props.form.automaticThoughts.filter(t => t.id !== id);
}

// Step 5 Actions
function addAdaptiveThought() {
  props.form.adaptiveThoughts.push({ id: genId(), text: "", type: "balanced", confidence: 50 });
}
function removeAdaptiveThought(id) {
  props.form.adaptiveThoughts = props.form.adaptiveThoughts.filter(t => t.id !== id);
}

// Step 6 Logic
watch(() => props.step, (newStep) => {
  if (newStep === 6) {
    const reEval = props.form.moods.map(m => {
      const existing = props.form.moodReEvaluation.find(r => r.name === m.name);
      return existing || { name: m.name, before: m.level, after: m.level };
    });
    props.form.moodReEvaluation = reEval;
  }
});
</script>

<template>
  <div>
    <!-- Progress bar -->
    <div style="height: 3px; background: var(--border); margin-top: -20px; margin-left: -20px; margin-right: -20px; margin-bottom: 20px;">
      <div :style="{ height: '100%', width: `${progress}%`, background: 'var(--accent)', transition: 'width 0.3s ease' }"></div>
    </div>

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
        <input v-model="newMood" @keydown.enter="handleAddCustomMood" placeholder="気分を追加..." class="inp" style="flex: 1; border: 1.5px solid var(--border)" />
        <button @click="handleAddCustomMood" class="btn btn-primary btn-small">追加</button>
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

    <!-- Float bar -->
    <div class="float-bar">
      <button @click="step === 0 ? emit('cancel') : emit('update:step', step - 1)" class="btn btn-ghost">
        {{ step === 0 ? "キャンセル" : "← 戻る" }}
      </button>
      <button v-if="step < totalSteps - 1" @click="emit('update:step', step + 1)" class="btn btn-primary">次へ →</button>
      <button v-else @click="emit('save')" class="btn btn-primary" style="background: var(--accent)">💾 保存する</button>
    </div>
  </div>
</template>
