<script setup lang="ts">
import type { QuestionType } from '#shared/types/game'
import { QUESTION_TYPE_LABELS } from '#shared/constants/questionTypes'

useHead({ title: '題庫瀏覽' })

type QuestionListItem = {
  id: string
  type: QuestionType
  preview: string
  correct: string
  createdAt: string
}

type ListResponse = {
  stats: {
    songs: number
    characters: number
    quotes: number
    total: number
  }
  items: QuestionListItem[]
}

const loading = ref(true)
const error = ref<string | null>(null)
const data = ref<ListResponse | null>(null)

const loadBank = async () => {
  loading.value = true
  error.value = null
  try {
    data.value = await $fetch<ListResponse>('/api/question-bank/list')
  }
  catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    error.value = err.data?.message ?? '載入題庫失敗'
  }
  finally {
    loading.value = false
  }
}

onMounted(() => {
  loadBank()
})

const formatDate = (value: string) =>
  new Date(value).toLocaleString('zh-TW')
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-6">
    <div class="text-center">
      <h1 class="text-2xl font-bold text-white">
        題庫瀏覽
      </h1>
      <p class="text-sm text-slate-400">
        查看目前已收錄的題目
      </p>
    </div>

    <AppCard v-if="loading" class="text-center text-slate-400">
      載入中...
    </AppCard>

    <AppCard v-else-if="error" class="space-y-4 text-center">
      <p class="text-sm text-rose-400" role="alert">{{ error }}</p>
      <AppButton aria-label="重新載入題庫" @click="loadBank">
        重新載入
      </AppButton>
    </AppCard>

    <template v-else-if="data">
      <AppCard class="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div class="rounded-lg bg-black/20 p-3">
          <p class="text-slate-400">總題數</p>
          <p class="text-xl font-semibold text-white">{{ data.stats.total }}</p>
        </div>
        <div class="rounded-lg bg-black/20 p-3">
          <p class="text-slate-400">猜歌</p>
          <p class="text-xl font-semibold text-white">{{ data.stats.songs }}</p>
        </div>
        <div class="rounded-lg bg-black/20 p-3">
          <p class="text-slate-400">猜角色</p>
          <p class="text-xl font-semibold text-white">{{ data.stats.characters }}</p>
        </div>
        <div class="rounded-lg bg-black/20 p-3">
          <p class="text-slate-400">猜台詞</p>
          <p class="text-xl font-semibold text-white">{{ data.stats.quotes }}</p>
        </div>
      </AppCard>

      <AppCard class="space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="font-semibold text-white">
            題目列表
          </h2>
          <button
            type="button"
            class="text-sm text-indigo-300 hover:text-indigo-200"
            aria-label="重新整理題庫列表"
            @click="loadBank"
          >
            重新整理
          </button>
        </div>

        <ul v-if="data.items.length" class="space-y-2">
          <li
            v-for="item in data.items"
            :key="item.id"
            class="rounded-lg border border-white/10 bg-black/20 px-3 py-3 text-sm"
          >
            <div class="mb-1 flex flex-wrap items-center gap-2">
              <span class="rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs text-indigo-200">
                {{ QUESTION_TYPE_LABELS[item.type] }}
              </span>
              <span class="text-xs text-slate-500">{{ formatDate(item.createdAt) }}</span>
            </div>
            <p class="truncate text-slate-300" :title="item.preview">
              {{ item.preview }}
            </p>
            <p class="mt-1 text-emerald-300">
              正解：{{ item.correct }}
            </p>
          </li>
        </ul>

        <p v-else class="text-center text-sm text-slate-400">
          尚無題目，請先新增
        </p>
      </AppCard>
    </template>

    <div class="grid gap-3 sm:grid-cols-2">
      <NuxtLink to="/host/create">
        <AppButton class="w-full" aria-label="新增題目">
          新增題目
        </AppButton>
      </NuxtLink>
      <NuxtLink to="/host">
        <AppButton variant="secondary" class="w-full" aria-label="返回開房設定">
          返回開房設定
        </AppButton>
      </NuxtLink>
    </div>
  </div>
</template>
