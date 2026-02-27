<script setup>
import { formatWhen } from '../utils';

defineProps({
  record: { type: Object, required: true }
});

const emit = defineEmits(['back', 'delete']);
</script>

<template>
  <div>
    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px">
      <button @click="emit('back')" class="btn btn-ghost btn-small">← 戻る</button>
      <span style="color: var(--text-muted); font-size: 0.82rem">{{ new Date(record.createdAt).toLocaleString("ja-JP") }}</span>
      <button @click="emit('delete', record.id)" class="btn btn-danger" style="margin-left: auto">削除</button>
    </div>

    <div class="card">
      <div class="detail-section-title">① 状況</div>
      <div style="display: flex; flex-direction: column; gap: 6px">
        <div v-if="record.situation.when"><span class="detail-label">📅 いつ　　</span>{{ formatWhen(record.situation.when) }}</div>
        <div v-if="record.situation.where"><span class="detail-label">📍 どこで　</span>{{ record.situation.where }}</div>
        <div v-if="record.situation.who"><span class="detail-label">👤 だれが　</span>{{ record.situation.who }}</div>
      </div>
    </div>

    <div v-if="record.moods.length > 0" class="card">
      <div class="detail-section-title">② 気分</div>
      <div style="display: flex; flex-wrap: wrap; gap: 8px">
        <div v-for="m in record.moods" :key="m.name" class="chip chip-active">
          {{ m.name }} <strong>{{ m.level }}%</strong>
        </div>
      </div>
    </div>

    <div v-if="record.automaticThoughts.some(t => t.text)" class="card">
      <div class="detail-section-title">③ 自動思考</div>
      <div style="display: flex; flex-direction: column; gap: 8px">
        <div v-for="t in record.automaticThoughts.filter(t => t.text)" :key="t.id" style="display: flex; gap: 10px; align-items: flex-start">
          <span :style="{ color: t.isKey ? 'var(--accent)' : 'var(--border)', fontWeight: 700, fontSize: '1rem', flexShrink: 0 }">◯</span>
          <span style="line-height: 1.6">{{ t.text }}</span>
        </div>
      </div>
    </div>

    <div v-if="record.evidence" class="card">
      <div class="detail-section-title">④ 根拠</div>
      <div style="line-height: 1.7; white-space: pre-wrap">{{ record.evidence }}</div>
    </div>

    <div v-if="record.counterEvidence" class="card">
      <div class="detail-section-title">⑤ 反証</div>
      <div style="line-height: 1.7; white-space: pre-wrap">{{ record.counterEvidence }}</div>
    </div>

    <div v-if="record.adaptiveThoughts.some(t => t.text)" class="card">
      <div class="detail-section-title">⑥ 適応的思考</div>
      <div style="display: flex; flex-direction: column; gap: 10px">
        <div v-for="t in record.adaptiveThoughts.filter(t => t.text)" :key="t.id" style="background: var(--surface2); border-radius: 8px; padding: 10px 14px">
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

    <div v-if="record.moodReEvaluation.length > 0" class="card">
      <div class="detail-section-title">⑦ 気分の再評価</div>
      <div style="display: flex; flex-direction: column; gap: 8px">
        <div v-for="r in record.moodReEvaluation" :key="r.name" style="display: flex; align-items: center; gap: 10px">
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
</template>
