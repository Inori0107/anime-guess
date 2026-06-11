<script setup lang="ts">
import type { ManualQuestionInput, QuestionType } from '#shared/types/game'
import { QUESTION_TYPE_LABELS } from '#shared/constants/questionTypes'

useHead({ title: '建立題目' })

const { draft, loadDraft, addQuestion, removeQuestion } = useHostDraft()

const questionType = ref<QuestionType>('song')
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const saving = ref(false)

const wrongOptions = ref<[string, string, string]>(['', '', ''])

const songForm = ref({ audioUrl: '', correct: '' })
const characterForm = ref({ imageUrl: '', correct: '' })
const quoteForm = ref({
  quote: '',
  answerKind: 'character' as 'character' | 'anime',
  correct: '',
})

onMounted(() => {
  loadDraft()
})

const hasLabel = (value: string) => Boolean(value.trim())

const resetForm = () => {
  songForm.value = { audioUrl: '', correct: '' }
  characterForm.value = { imageUrl: '', correct: '' }
  quoteForm.value = { quote: '', answerKind: 'character', correct: '' }
  wrongOptions.value = ['', '', '']
}

const handleAddQuestion = async () => {
  error.value = null
  successMessage.value = null
  let question: ManualQuestionInput | null = null

  if (questionType.value === 'song') {
    if (!songForm.value.audioUrl.trim() || !hasLabel(songForm.value.correct)) {
      error.value = '請填寫音檔 URL 與正確選項'
      return
    }
    if (!wrongOptions.value.every(hasLabel)) {
      error.value = '請填寫 3 個錯誤選項'
      return
    }
    question = {
      type: 'song',
      song: {
        audioUrl: songForm.value.audioUrl.trim(),
        correct: songForm.value.correct,
        wrong: wrongOptions.value,
      },
    }
  }

  if (questionType.value === 'character') {
    if (!characterForm.value.imageUrl.trim() || !hasLabel(characterForm.value.correct)) {
      error.value = '請填寫圖片 URL 與正確角色名'
      return
    }
    if (!wrongOptions.value.every(hasLabel)) {
      error.value = '請填寫 3 個錯誤選項'
      return
    }
    question = {
      type: 'character',
      character: {
        imageUrl: characterForm.value.imageUrl.trim(),
        correct: characterForm.value.correct,
        wrong: wrongOptions.value,
      },
    }
  }

  if (questionType.value === 'quote') {
    if (!hasLabel(quoteForm.value.quote) || !hasLabel(quoteForm.value.correct)) {
      error.value = '請填寫台詞與正確選項'
      return
    }
    if (!wrongOptions.value.every(hasLabel)) {
      error.value = '請填寫 3 個錯誤選項'
      return
    }
    question = {
      type: 'quote',
      quote: {
        quote: quoteForm.value.quote,
        answerKind: quoteForm.value.answerKind,
        correct: quoteForm.value.correct,
        wrong: wrongOptions.value,
      },
    }
  }

  if (!question) {
    return
  }

  saving.value = true
  try {
    const result = await $fetch<{
      added: number
      skipped: number
      stats: { total: number }
      message: string
    }>('/api/question-bank/add', {
      method: 'POST',
      body: { questions: [question] },
    })

    addQuestion(question)
    resetForm()
    successMessage.value = result.added > 0
      ? `${result.message}（題庫共 ${result.stats.total} 題）`
      : `本局已加入，題庫已有相同題目（共 ${result.stats.total} 題）`
  }
  catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    error.value = err.data?.message ?? '加入題庫失敗'
  }
  finally {
    saving.value = false
  }
}

const typeLabel = QUESTION_TYPE_LABELS
</script>

<template>
  <div class="mx-auto max-w-2xl space-y-6">
    <div class="text-center">
      <h1 class="text-2xl font-bold text-white">
        建立題目
      </h1>
      <p class="text-sm text-slate-400">
        新增後會同步寫入題庫
      </p>
    </div>

    <AppCard class="space-y-4">
      <div class="flex gap-2">
        <button
          v-for="t in (['song', 'character', 'quote'] as QuestionType[])"
          :key="t"
          type="button"
          class="rounded-full border px-3 py-1.5 text-sm transition"
          :class="questionType === t ? 'border-indigo-400 bg-indigo-500/20 text-white' : 'border-white/10 text-slate-400'"
          @click="questionType = t"
        >
          {{ typeLabel[t] }}
        </button>
      </div>

      <div v-if="questionType === 'song'" class="space-y-3">
        <input
          v-model="songForm.audioUrl"
          type="url"
          placeholder="音檔或 YouTube 連結"
          class="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white"
          aria-label="音檔或 YouTube 連結"
        >
        <LabelField v-model="songForm.correct" label="正確答案（曲名）" />
      </div>

      <div v-if="questionType === 'character'" class="space-y-3">
        <input
          v-model="characterForm.imageUrl"
          type="url"
          placeholder="圖片連結（任意來源）"
          class="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white"
          aria-label="圖片連結"
        >
        <LabelField v-model="characterForm.correct" label="正確答案（角色名）" />
      </div>

      <div v-if="questionType === 'quote'" class="space-y-3">
        <LabelField v-model="quoteForm.quote" label="台詞" />
        <div class="flex gap-2">
          <button
            type="button"
            class="rounded-full border px-3 py-1 text-sm"
            :class="quoteForm.answerKind === 'character' ? 'border-indigo-400 text-white' : 'border-white/10 text-slate-400'"
            @click="quoteForm.answerKind = 'character'"
          >
            猜角色
          </button>
          <button
            type="button"
            class="rounded-full border px-3 py-1 text-sm"
            :class="quoteForm.answerKind === 'anime' ? 'border-indigo-400 text-white' : 'border-white/10 text-slate-400'"
            @click="quoteForm.answerKind = 'anime'"
          >
            猜作品
          </button>
        </div>
        <LabelField v-model="quoteForm.correct" label="正確答案" />
      </div>

      <div class="space-y-2 border-t border-white/10 pt-4">
        <p class="text-sm text-slate-300">錯誤選項</p>
        <LabelField v-model="wrongOptions[0]" label="錯誤選項 1" />
        <LabelField v-model="wrongOptions[1]" label="錯誤選項 2" />
        <LabelField v-model="wrongOptions[2]" label="錯誤選項 3" />
      </div>

      <p v-if="error" class="text-sm text-rose-400" role="alert">{{ error }}</p>
      <p v-if="successMessage" class="text-sm text-emerald-400" role="status">{{ successMessage }}</p>

      <AppButton
        class="w-full"
        :disabled="saving"
        aria-label="新增題目"
        @click="handleAddQuestion"
      >
        {{ saving ? '儲存中...' : '新增題目並加入題庫' }}
      </AppButton>
    </AppCard>

    <AppCard v-if="draft.questions.length">
      <h2 class="mb-3 font-semibold text-white">已建立 {{ draft.questions.length }} 題</h2>
      <ul class="space-y-2">
        <li
          v-for="(q, i) in draft.questions"
          :key="i"
          class="flex items-center justify-between rounded-lg bg-black/20 px-3 py-2 text-sm"
        >
          <span>{{ typeLabel[q.type] }} #{{ i + 1 }}</span>
          <button
            type="button"
            class="text-rose-400 hover:text-rose-300"
            aria-label="刪除題目"
            @click="removeQuestion(i)"
          >
            刪除
          </button>
        </li>
      </ul>
    </AppCard>

    <NuxtLink to="/host">
      <AppButton variant="secondary" class="w-full" aria-label="返回開房設定">
        返回開房設定
      </AppButton>
    </NuxtLink>

    <NuxtLink to="/host/bank" class="block text-center text-sm text-indigo-300 hover:text-indigo-200">
      瀏覽題庫
    </NuxtLink>
  </div>
</template>
