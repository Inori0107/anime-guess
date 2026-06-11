<script setup lang="ts">
useHead({ title: '結算' })

const route = useRoute()
const code = computed(() => String(route.params.code).toUpperCase())

type ResultData = {
  code: string
  leaderboard: Array<{
    playerId: string
    nickname: string
    score: number
    isHost: boolean
  }>
  totalQuestions: number
}

const result = ref<ResultData | null>(null)
const loading = ref(true)

const { clearSession } = useGameSession()

onMounted(async () => {
  try {
    result.value = await $fetch<ResultData>(`/api/room/${code.value}/result`)
  }
  catch {
    result.value = null
  }
  finally {
    loading.value = false
  }
})

const handlePlayAgain = () => {
  clearSession()
  navigateTo('/')
}
</script>

<template>
  <div class="mx-auto max-w-lg space-y-6">
    <div class="text-center">
      <h1 class="text-3xl font-bold text-white">
        遊戲結束
      </h1>
      <p class="text-slate-400">
        房號 {{ code }} · 共 {{ result?.totalQuestions ?? 0 }} 題
      </p>
    </div>

    <AppCard>
      <h2 class="mb-4 text-center text-lg font-semibold text-amber-300">
        排行榜
      </h2>

      <div v-if="loading" class="text-center text-slate-400">
        載入中...
      </div>

      <ol v-else-if="result?.leaderboard.length" class="space-y-3">
        <li
          v-for="(player, index) in result.leaderboard"
          :key="player.playerId"
          class="flex items-center justify-between rounded-xl border px-4 py-3"
          :class="index === 0 ? 'border-amber-400/50 bg-amber-500/10' : 'border-white/10 bg-black/20'"
        >
          <div class="flex items-center gap-3">
            <span class="text-2xl font-bold text-slate-500">#{{ index + 1 }}</span>
            <div>
              <p class="font-semibold text-white">
                {{ player.nickname }}
                <span v-if="player.isHost" class="text-xs text-amber-300">（主辦）</span>
              </p>
            </div>
          </div>
          <span class="text-xl font-bold text-indigo-300">{{ player.score }}</span>
        </li>
      </ol>

      <p v-else class="text-center text-slate-400">
        找不到結算資料
      </p>
    </AppCard>

    <AppButton class="w-full" aria-label="再玩一次" @click="handlePlayAgain">
      再玩一次
    </AppButton>
  </div>
</template>
