<script setup>
defineProps({
  label: {
    type: String,
    required: true,
  },
  value: {
    type: Number,
    required: true,
  },
  detail: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <p class="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">{{ label }}</p>
    <p class="mt-3 text-3xl font-semibold text-slate-900">{{ value }}</p>
    <p v-if="detail" class="mt-2 text-sm text-slate-500">{{ detail }}</p>
  </div>
</template>
