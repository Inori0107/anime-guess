<script setup lang="ts">
import type { CharacterPrompt, QuotePrompt, SongPrompt } from '#shared/types/game'
import { QUESTION_TYPE_LABELS } from '#shared/constants/questionTypes'

definePageMeta({ middleware: 'room-session' })

useHead({ title: '遊戲進行中' })

const route = useRoute()
const code = computed(() => String(route.params.code).toUpperCase())

const { roomState, submitAnswer, useHint, lastError } = useRoom(code)
const { syncPlayRoute } = useRoomNavigation(code)
const { getSession } = useGameSession()
const session = getSession()

const selectedId = ref<string | null>(null)
const hintStage = ref(0)
const submitting = ref(false)
const hasAnswered = ref(false)

const question = computed(() => roomState.value?.currentQuestion ?? null)
const isRevealing = computed(() => roomState.value?.status === 'revealing')
const isGenerating = computed(() => roomState.value?.status === 'generating')
const isPlaying = computed(() => roomState.value?.status === 'playing')
const myResult = computed(() => {
  if (!session || !roomState.value?.revealData) {
    return null
  }
  return roomState.value.revealData.playerResults.find(r => r.playerId === session.playerId)
})

watch(question, () => {
  selectedId.value = null
  hintStage.value = 0
  hasAnswered.value = false
})

watch(() => roomState.value?.status, syncPlayRoute)

const handleSelect = async (choiceId: string) => {
  if (!isPlaying.value || submitting.value) {
    return
  }
  selectedId.value = choiceId
  submitting.value = true
  try {
    await submitAnswer(choiceId, hintStage.value)
    hasAnswered.value = true
  }
  catch {
    // error handled by fetch
  }
  finally {
    submitting.value = false
  }
}

const handleHint = async () => {
  const stage = await useHint()
  hintStage.value = stage
}

const typeLabel = QUESTION_TYPE_LABELS
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p class="text-sm text-slate-400">
          第 {{ question?.index ?? '-' }} / {{ question?.total ?? '-' }} 題
        </p>
        <h1 class="text-xl font-bold text-white">
          {{ question ? typeLabel[question.type] : '載入中' }}
        </h1>
      </div>
      <RoundTimer v-if="roomState?.roundDeadline && isPlaying" :deadline="roomState.roundDeadline" />
    </div>

    <div
      v-if="isPlaying && roomState"
      class="rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-center text-sm text-slate-300"
    >
      已作答 {{ roomState.answeredCount }} / {{ roomState.players.length }} 人
    </div>

    <AppCard v-if="isGenerating" class="text-center">
      <p class="animate-pulse text-indigo-300">出題中，請稍候...</p>
    </AppCard>

    <AppCard v-if="question && isPlaying">
      <SongQuestion
        v-if="question.type === 'song'"
        :prompt="question.prompt as SongPrompt"
        :choices="question.choices"
        :selected-id="selectedId"
        :disabled="submitting"
        @select="handleSelect"
      />
      <CharacterQuestion
        v-else-if="question.type === 'character'"
        :prompt="question.prompt as CharacterPrompt"
        :choices="question.choices"
        :selected-id="selectedId"
        :hint-stage="hintStage"
        :disabled="submitting"
        @select="handleSelect"
        @hint="handleHint"
      />
      <QuoteQuestion
        v-else-if="question.type === 'quote'"
        :prompt="question.prompt as QuotePrompt"
        :choices="question.choices"
        :selected-id="selectedId"
        :disabled="submitting"
        @select="handleSelect"
      />

      <p v-if="hasAnswered" class="mt-4 text-center text-sm text-emerald-400">
        已送出答案，等待其他玩家...
      </p>
    </AppCard>

    <AppCard v-if="isRevealing && roomState?.revealData" class="space-y-4 text-center">
      <p class="text-lg font-semibold text-white">本題結果</p>
      <p class="text-indigo-300">
        正確答案：{{ roomState.revealData.correctDisplay }}
      </p>
      <p v-if="myResult" :class="myResult.isCorrect ? 'text-emerald-400' : 'text-rose-400'">
        {{ myResult.isCorrect ? `答對了！+${myResult.earnedScore} 分` : '答錯了' }}
        （總分 {{ myResult.totalScore }}）
      </p>
      <p class="text-sm text-slate-400 animate-pulse">下一題即將開始...</p>
    </AppCard>

    <p v-if="lastError" class="text-center text-sm text-amber-400">{{ lastError }}</p>
  </div>
</template>
