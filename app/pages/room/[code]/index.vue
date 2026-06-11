<script setup lang="ts">
definePageMeta({ middleware: 'room-session' })

useHead({ title: '等待室' })

const route = useRoute()
const code = computed(() => String(route.params.code).toUpperCase())

const { roomState, lastError, startGame, wsConnected } = useRoom(code)
const { syncLobbyRoute } = useRoomNavigation(code)
const { getSession } = useGameSession()
const session = getSession()

const isHost = computed(() =>
  session?.playerId === roomState.value?.hostId,
)

const canStart = computed(() =>
  roomState.value?.status === 'lobby' && isHost.value,
)

const isFull = computed(() =>
  (roomState.value?.players.length ?? 0) >= (roomState.value?.settings.maxPlayers ?? 6),
)

const starting = ref(false)
const startError = ref<string | null>(null)
const copied = ref(false)

const handleCopyCode = async () => {
  if (!navigator?.clipboard) {
    return
  }
  await navigator.clipboard.writeText(code.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

const handleStart = async () => {
  startError.value = null
  starting.value = true
  try {
    await startGame()
  }
  catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    startError.value = err.data?.message ?? '開始失敗'
  }
  finally {
    starting.value = false
  }
}

watch(() => roomState.value?.status, syncLobbyRoute)
</script>

<template>
  <div class="mx-auto max-w-lg space-y-6">
    <div class="text-center">
      <p class="text-sm text-slate-400">房號</p>
      <div class="flex items-center justify-center gap-2">
        <h1 class="text-3xl font-bold tracking-widest text-white">
          {{ code }}
        </h1>
        <button
          type="button"
          class="rounded-lg border border-white/20 px-2 py-1 text-xs text-slate-300 hover:bg-white/10"
          aria-label="複製房號"
          @click="handleCopyCode"
        >
          {{ copied ? '已複製' : '複製' }}
        </button>
      </div>
      <p class="mt-1 text-xs" :class="wsConnected ? 'text-emerald-400' : 'text-amber-400'">
        {{ wsConnected ? '已連線' : '連線中...' }}
      </p>
    </div>

    <AppCard>
      <h2 class="mb-3 font-semibold text-white">玩家列表</h2>
      <PlayerList
        v-if="roomState"
        :players="roomState.players"
        :max-players="roomState.settings.maxPlayers"
      />
      <p v-else class="text-slate-400">載入中...</p>

      <p v-if="isFull" class="mt-3 text-center text-sm text-amber-300">
        房間已滿（6/6）
      </p>
    </AppCard>

    <AppCard v-if="roomState?.status === 'generating'" class="text-center">
      <p class="animate-pulse text-indigo-300">出題中，請稍候...</p>
    </AppCard>

    <AppCard v-if="canStart" class="space-y-3 text-center">
      <p class="text-sm text-slate-400">
        準備好後按開始（至少 1 人即可開局）
      </p>
      <p v-if="startError" class="text-sm text-rose-400">{{ startError }}</p>
      <AppButton
        :disabled="starting"
        aria-label="開始遊戲"
        @click="handleStart"
      >
        {{ starting ? '出題中...' : '開始遊戲' }}
      </AppButton>
    </AppCard>

    <p v-if="!isHost && roomState?.status === 'lobby'" class="text-center text-sm text-slate-400">
      等待主辦方開始遊戲...
    </p>

    <p v-if="lastError" class="text-center text-sm text-amber-400">{{ lastError }}</p>

    <NuxtLink to="/" class="block text-center text-sm text-slate-400 hover:text-white">
      離開房間
    </NuxtLink>
  </div>
</template>
