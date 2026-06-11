<script setup lang="ts">
import type { PublicChoice } from '#shared/types/game'

const props = defineProps<{
  choices: PublicChoice[]
  selectedId: string | null
  disabled?: boolean
}>()

const emit = defineEmits<{
  select: [choiceId: string]
}>()

const labels = ['A', 'B', 'C', 'D']

const handleSelect = (choiceId: string) => {
  if (props.disabled) {
    return
  }
  emit('select', choiceId)
}

const handleKeyDown = (event: KeyboardEvent, choiceId: string) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    handleSelect(choiceId)
  }
}
</script>

<template>
  <div class="grid gap-3 sm:grid-cols-2" role="listbox" aria-label="選擇答案">
    <button
      v-for="(choice, index) in choices"
      :key="choice.id"
      type="button"
      role="option"
      :aria-selected="selectedId === choice.id"
      :aria-label="`選項 ${labels[index]}：${choice.display}`"
      tabindex="0"
      class="rounded-xl border px-4 py-4 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-400"
      :class="selectedId === choice.id
        ? 'border-indigo-400 bg-indigo-500/20 text-white'
        : 'border-white/10 bg-black/20 text-slate-200 hover:border-indigo-400/50 hover:bg-indigo-500/10'"
      :disabled="disabled"
      @click="handleSelect(choice.id)"
      @keydown="handleKeyDown($event, choice.id)"
    >
      <span class="mb-1 block text-xs font-bold text-indigo-300">{{ labels[index] }}</span>
      <span class="block leading-relaxed">{{ choice.display }}</span>
    </button>
  </div>
</template>
