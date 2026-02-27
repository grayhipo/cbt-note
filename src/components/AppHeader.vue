<script setup>
defineProps({
  view: { type: String, required: true },
  step: { type: Number, default: 0 },
  totalSteps: { type: Number, default: 0 },
  stepLabel: { type: String, default: "" },
  activeMoodsCount: { type: Number, default: 0 }
});

defineEmits(['back', 'openMenu']);
</script>

<template>
  <div class="header">
    <div style="display: flex; align-items: center; gap: 10px">
      <button v-if="view === 'new' || view === 'detail'" @click="$emit('back')" style="background: none; border: none; fontSize: 1.2rem; color: var(--text-muted); padding: 0 4px">←</button>
      <a href="/cbt-note/" class="header-title" style="text-decoration: none">思考記録</a>
    </div>
    <div style="display: flex; align-items: center; gap: 10px">
      <span v-if="view === 'new'" style="font-size: 0.82rem; color: var(--text-muted)">
        {{ step + 1 }} / {{ totalSteps }}　{{ stepLabel }}
      </span>
      <button
        @click="$emit('openMenu')"
        style="background: none; border: none; padding: 6px 8px; display: flex; flex-direction: column; gap: 5px; cursor: pointer; position: relative"
        aria-label="メニューを開く"
      >
        <span v-for="i in 3" :key="i" :style="{ display: 'block', width: '22px', height: '2px', background: activeMoodsCount > 0 ? 'var(--accent)' : 'var(--text-muted)', borderRadius: '2px' }"></span>
        <span v-if="activeMoodsCount > 0" style="position: absolute; top: 2px; right: 2px; background: var(--accent); color: #fff; border-radius: 50%; width: 16px; height: 16px; font-size: 0.65rem; font-weight: 700; display: flex; align-items: center; justify-content: center">
          {{ activeMoodsCount }}
        </span>
      </button>
    </div>
  </div>
</template>