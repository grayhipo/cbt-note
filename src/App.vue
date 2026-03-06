<script setup>
import { ref, computed, onMounted } from "vue";
import { genId } from './utils';
import HomeView from './components/HomeView.vue';
import WizardView from './components/WizardView.vue';
import DetailView from './components/DetailView.vue';
import AppHeader from './components/AppHeader.vue';
import MenuDrawer from './components/MenuDrawer.vue';

// ── Constants & Helpers ───────────────────────────────────────────────────────
const DEFAULT_MOODS = ["不安", "無力感", "怒り", "悲しみ", "恥", "罪悪感", "孤独", "恐怖", "混乱", "落ち込み", "イライラ", "焦り"];
const STEP_LABELS = ["状況", "気分", "自動思考", "根拠", "反証", "適応的思考", "再評価"];

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

// ── Computed ──────────────────────────────────────────────────────────────────
const totalSteps = STEP_LABELS.length;

const allMoods = computed(() => [...DEFAULT_MOODS, ...customMoods.value]);

const allMoodNamesInRecords = computed(() => {
  return [...new Set(records.value.flatMap(r => r.moods.map(m => m.name)))].sort();
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

function addCustomMood(name) {
  if (!name || allMoods.value.includes(name)) return;
  saveCustomMoodsToStorage([...customMoods.value, name]);
  // WizardView側でtoggleMoodを呼ぶか、formを直接操作する必要があるが、
  // ここではcustomMoodsの更新のみ行い、選択状態の更新はWizardViewに任せる（あるいは再描画で反映）
}

</script>

<template>
  <div v-if="!loaded" style="display: flex; align-items: center; justify-content: center; height: 100vh; color: var(--text-muted)">
    読み込み中...
  </div>

  <div v-else class="app">
    <AppHeader
      :view="view"
      :step="step"
      :total-steps="totalSteps"
      :step-label="STEP_LABELS[step]"
      :active-moods-count="activeMoods.length"
      @back="view = 'home'"
      @open-menu="menuOpen = true"
    />

    <!-- Content -->
    <div style="max-width: 640px; margin: 0 auto; padding: 20px; padding-bottom: 80px;">
      
      <!-- HOME VIEW -->
      <HomeView v-if="view === 'home'"
        :records="records"
        :active-moods="activeMoods"
        @start-new="startNew"
        @select-record="(r) => { selectedRecord = r; view = 'detail'; }"
      />

      <!-- WIZARD STEPS -->
      <WizardView v-if="view === 'new'"
        v-model:step="step"
        :form="form"
        :all-moods="allMoods"
        :custom-moods="customMoods"
        @save="handleSave"
        @cancel="view = 'home'"
        @add-custom-mood="addCustomMood"
      />

      <!-- DETAIL VIEW -->
      <DetailView v-if="view === 'detail' && selectedRecord"
        :record="selectedRecord"
        @back="view = 'home'"
        @delete="deleteRecord"
      />
    </div>

    <MenuDrawer
      :is-open="menuOpen"
      :records="records"
      :active-moods="activeMoods"
      :all-mood-names="allMoodNamesInRecords"
      @close="menuOpen = false"
      @import="(newRecords) => saveRecordsToStorage([...records, ...newRecords])"
      @update:active-moods="(newMoods) => activeMoods = newMoods"
    />
  </div>
</template>