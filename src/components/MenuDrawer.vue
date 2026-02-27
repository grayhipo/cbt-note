<script setup>
import { ref } from 'vue';
import { csvToRecords, CSV_HEADERS, escapeCsvCell } from '../utils';

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  records: { type: Array, required: true },
  activeMoods: { type: Array, required: true },
  allMoodNames: { type: Array, required: true }
});

const emit = defineEmits(['close', 'import', 'update:activeMoods']);

const importError = ref("");
const importSuccess = ref("");
const dropdownOpen = ref(false);

function handleExport() {
  const header = CSV_HEADERS.join(",");
  const rows = props.records.map(r => [
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
  emit('close');
}

function handleImportFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const imported = csvToRecords(ev.target.result);
      const existingIds = new Set(props.records.map(r => r.id));
      const newOnes = imported.filter(r => !existingIds.has(r.id));
      
      if (newOnes.length > 0) {
        emit('import', newOnes);
      }
      
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
  let newMoods;
  if (props.activeMoods.includes(name)) {
    newMoods = props.activeMoods.filter(n => n !== name);
  } else {
    newMoods = [...props.activeMoods, name];
  }
  emit('update:activeMoods', newMoods);
}
</script>

<template>
  <div v-if="isOpen">
    <div class="drawer-overlay" @click="$emit('close')"></div>
    <div class="drawer">
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--border)">
        <span style="font-family: 'Shippori Mincho', serif; font-weight: 600; color: var(--accent); font-size: 1.05rem">メニュー</span>
        <button @click="$emit('close')" style="background: none; border: none; font-size: 1.3rem; color: var(--text-muted); padding: 2px 6px">✕</button>
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

        <div v-if="allMoodNames.length > 0">
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
              <button v-for="name in allMoodNames" :key="name" @click="toggleMoodFilter(name)"
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
              <button @click="$emit('update:activeMoods', [])" class="btn btn-ghost" style="padding: 4px 10px; font-size: 0.75rem">すべて解除</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>