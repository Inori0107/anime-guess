<script setup lang="ts">
import type { PublicChoice, QuotePrompt } from '#shared/types/game'

defineProps<{
  prompt: QuotePrompt
  choices: PublicChoice[]
  selectedId: string | null
  disabled?: boolean
}>()

const emit = defineEmits<{
  select: [choiceId: string]
}>()

const answerLabel = (kind: 'character' | 'anime') =>
  kind === 'character' ? '猜角色' : '猜作品'
</script>

<template>
  <div class="space-y-4">
    <div class="rounded-xl border border-white/10 bg-black/30 p-5">
      <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-indigo-300">
        {{ answerLabel(prompt.answerKind) }}
      </p>
      <p class="text-base leading-relaxed text-white">
        「{{ prompt.text }}」
      </p>
    </div>
    <ChoiceGrid
      :choices="choices"
      :selected-id="selectedId"
      :disabled="disabled"
      @select="emit('select', $event)"
    />
  </div>
</template>
