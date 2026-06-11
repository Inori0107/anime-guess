<script setup lang="ts">
import { BLUR_STAGES } from '#shared/types/game'
import type { CharacterPrompt, PublicChoice } from '#shared/types/game'

const props = defineProps<{
  prompt: CharacterPrompt
  choices: PublicChoice[]
  selectedId: string | null
  hintStage: number
  disabled?: boolean
}>()

const emit = defineEmits<{
  select: [choiceId: string]
  hint: []
}>()

const blurPx = computed(() => BLUR_STAGES[Math.min(props.hintStage, 3)] ?? 0)
const imageError = ref(false)

const handleHint = () => {
  if (props.hintStage >= 3 || props.disabled) {
    return
  }
  emit('hint')
}

const handleHintKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    handleHint()
  }
}

watch(() => props.prompt.imageUrl, () => {
  imageError.value = false
})
</script>

<template>
  <div class="space-y-4">
    <div
      class="relative mx-auto aspect-[3/4] w-full max-w-xs overflow-hidden rounded-xl border border-white/10 bg-black sm:max-w-sm"
    >
      <img
        v-if="!imageError"
        :src="prompt.imageUrl"
        alt="動漫角色圖片"
        class="h-full w-full object-contain transition-all duration-500"
        :style="{ filter: `blur(${blurPx}px)` }"
        @error="imageError = true"
      >
      <div
        v-else
        class="flex h-full w-full items-center justify-center text-sm text-slate-500"
      >
        圖片載入失敗
      </div>
      <div class="absolute bottom-3 right-3">
        <button
          type="button"
          class="rounded-full bg-indigo-500/90 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-50"
          :disabled="hintStage >= 3 || disabled"
          aria-label="顯示更清晰提示"
          tabindex="0"
          @click="handleHint"
          @keydown="handleHintKeyDown"
        >
          提示（{{ 3 - hintStage }} 次）
        </button>
      </div>
    </div>
    <p class="text-center text-xs text-slate-400">
      提示越少，答對分數越高
    </p>
    <ChoiceGrid
      :choices="choices"
      :selected-id="selectedId"
      :disabled="disabled"
      @select="emit('select', $event)"
    />
  </div>
</template>
