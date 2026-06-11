<script setup lang="ts">
const model = defineModel<string>({ required: true })

defineProps<{
  label: string
}>()
</script>

<template>
  <div class="space-y-1">
    <p class="text-xs text-slate-400">{{ label }}</p>
    <input
      v-model="model"
      type="text"
      class="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none"
      :aria-label="label"
    >
  </div>
</template>
