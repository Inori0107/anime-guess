<script setup lang="ts">
import type { QuestionType } from '#shared/types/game'
import { QUESTION_TYPE_OPTIONS } from '#shared/constants/questionTypes'

useHead({ title: '開房設定' })

const { draft, loadDraft, saveDraft } = useHostDraft()
const error = ref<string | null>(null)
const loading = ref(false)
const { setSession } = useGameSession()
const router = useRouter()

const typeOptions = QUESTION_TYPE_OPTIONS

onMounted(() => {
  loadDraft()
})

const toggleType = (type: QuestionType) => {
  const index = draft.value.types.indexOf(type)
  if (index >= 0 && draft.value.types.length > 1) {
    draft.value.types.splice(index, 1)
  }
  else if (index < 0) {
    draft.value.types.push(type)
  }
  saveDraft()
}

const handleCreate = async () => {
  error.value = null

  if (!draft.value.nickname.trim()) {
    error.value = '請輸入暱稱'
    return
  }

  if (draft.value.hostType === 'player' && draft.value.questions.length === 0) {
    await router.push('/host/create')
    return
  }

  loading.value = true
  saveDraft()

  try {
    const result = await $fetch<{
      code: string
      playerId: string
    }>('/api/room/create', {
      method: 'POST',
      body: {
        hostType: draft.value.hostType,
        nickname: draft.value.nickname.trim(),
        settings: {
          types: draft.value.types,
          count: draft.value.count,
          roundSeconds: draft.value.roundSeconds,
        },
        manualQuestions: draft.value.hostType === 'player' ? draft.value.questions : undefined,
      },
    })

    setSession({
      code: result.code,
      playerId: result.playerId,
      nickname: draft.value.nickname.trim(),
      isHost: true,
    })

    await router.push(`/room/${result.code}`)
  }
  catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    error.value = err.data?.message ?? '開房失敗'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-lg space-y-6">
    <div class="text-center">
      <h1 class="text-2xl font-bold text-white">
        開房設定
      </h1>
      <p class="text-sm text-slate-400">
        選擇出題方式與遊戲規則（1～6 人）
      </p>
      <p v-if="draft.hostType === 'system'" class="mt-1 text-xs text-indigo-300">
        系統出題使用本地繁中題庫（JSON），穩定且符合台灣用語
      </p>
    </div>

    <AppCard class="space-y-5">
      <div>
        <label for="host-nickname" class="mb-1 block text-sm text-slate-300">暱稱</label>
        <input
          id="host-nickname"
          v-model="draft.nickname"
          type="text"
          maxlength="12"
          class="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
          aria-label="主辦方暱稱"
          @change="saveDraft"
        >
      </div>

      <div>
        <p class="mb-2 text-sm text-slate-300">出題方</p>
        <div class="grid grid-cols-2 gap-3">
          <button
            type="button"
            class="rounded-xl border px-4 py-3 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-400"
            :class="draft.hostType === 'system' ? 'border-indigo-400 bg-indigo-500/20 text-white' : 'border-white/10 text-slate-300'"
            aria-label="系統自動出題"
            @click="draft.hostType = 'system'; saveDraft()"
          >
            系統出題
          </button>
          <button
            type="button"
            class="rounded-xl border px-4 py-3 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-400"
            :class="draft.hostType === 'player' ? 'border-indigo-400 bg-indigo-500/20 text-white' : 'border-white/10 text-slate-300'"
            aria-label="玩家手動出題"
            @click="draft.hostType = 'player'; saveDraft()"
          >
            玩家出題
          </button>
        </div>
      </div>

      <div v-if="draft.hostType === 'system'">
        <p class="mb-2 text-sm text-slate-300">題型（至少一種）</p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="opt in typeOptions"
            :key="opt.value"
            type="button"
            class="rounded-full border px-3 py-1.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-400"
            :class="draft.types.includes(opt.value) ? 'border-indigo-400 bg-indigo-500/20 text-white' : 'border-white/10 text-slate-400'"
            :aria-label="`選擇題型 ${opt.label}`"
            @click="toggleType(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>

        <div class="mt-4 grid grid-cols-2 gap-4">
          <div>
            <label for="question-count" class="mb-1 block text-sm text-slate-300">題數</label>
            <input
              id="question-count"
              v-model.number="draft.count"
              type="number"
              min="3"
              max="20"
              class="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white focus:border-indigo-400 focus:outline-none"
              @change="saveDraft"
            >
          </div>
          <div>
            <label for="round-seconds" class="mb-1 block text-sm text-slate-300">搶答秒數</label>
            <input
              id="round-seconds"
              v-model.number="draft.roundSeconds"
              type="number"
              min="10"
              max="60"
              class="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white focus:border-indigo-400 focus:outline-none"
              @change="saveDraft"
            >
          </div>
        </div>
      </div>

      <div v-else class="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
        玩家出題需先建立題目（至少 1 題）。
        目前已建立 {{ draft.questions.length }} 題。
        <NuxtLink to="/host/create" class="ml-1 underline hover:text-white">
          前往建題
        </NuxtLink>
      </div>

      <p v-if="error" class="text-sm text-rose-400" role="alert">
        {{ error }}
      </p>

      <AppButton
        class="w-full"
        :disabled="loading"
        aria-label="建立房間"
        @click="handleCreate"
      >
        {{ loading ? '建立中...' : draft.hostType === 'player' && draft.questions.length === 0 ? '前往建題' : '建立房間' }}
      </AppButton>
    </AppCard>

    <div class="flex justify-center gap-4 text-sm">
      <NuxtLink to="/host/create" class="text-indigo-300 hover:text-indigo-200">
        新增題目
      </NuxtLink>
      <NuxtLink to="/host/bank" class="text-indigo-300 hover:text-indigo-200">
        瀏覽題庫
      </NuxtLink>
    </div>

    <NuxtLink to="/" class="block text-center text-sm text-slate-400 hover:text-white">
      返回首頁
    </NuxtLink>
  </div>
</template>
