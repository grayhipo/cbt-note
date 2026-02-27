<script setup>
import { computed } from 'vue';
import { formatWhen } from '../utils';

const props = defineProps({
  records: { type: Array, required: true },
  activeMoods: { type: Array, required: true }
});

const emit = defineEmits(['startNew', 'selectRecord']);

const filteredRecords = computed(() => {
  if (props.activeMoods.length === 0) return props.records;
  return props.records.filter(r => props.activeMoods.every(name => r.moods.some(m => m.name === name)));
});
</script>

<template>
  <div>
    <button @click="emit('startNew')" class="btn btn-primary" style="width: 100%; padding: 14px 20px; font-size: 1rem; border-radius: var(--radius); margin-bottom: 12px; box-shadow: 0 4px 16px rgba(90,122,90,0.25); letter-spacing: 0.06em">
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
        <button v-for="r in filteredRecords.slice().reverse()" :key="r.id" @click="emit('selectRecord', r)"
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
</template>
