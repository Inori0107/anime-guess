<script setup lang="ts">
const props = defineProps<{
  videoId: string
  clipStartSec: number
  clipDurationSec: number
  maxReplays: number
}>()

const emit = defineEmits<{
  error: [message: string]
}>()

const { createPlayer } = useYouTubeIframeApi()

const playerContainerId = `yt-player-${Math.random().toString(36).slice(2)}`
const player = ref<Awaited<ReturnType<typeof createPlayer>> | null>(null)
const replayCount = ref(0)
const hasStarted = ref(false)
const isPlaying = ref(false)
const clipTimer = ref<ReturnType<typeof setTimeout> | null>(null)

const clearClipTimer = () => {
  if (clipTimer.value) {
    clearTimeout(clipTimer.value)
    clipTimer.value = null
  }
}

const stopClip = () => {
  clearClipTimer()
  player.value?.pauseVideo()
  isPlaying.value = false
}

const playClip = () => {
  if (!player.value) {
    return
  }

  clearClipTimer()
  player.value.seekTo(props.clipStartSec, true)
  player.value.playVideo()
  isPlaying.value = true
  hasStarted.value = true
  clipTimer.value = setTimeout(() => {
    stopClip()
  }, props.clipDurationSec * 1000)
}

const handlePlay = async () => {
  if (!player.value) {
    emit('error', 'YouTube 播放器尚未就緒')
    return
  }
  await playClip()
}

const handleReplay = async () => {
  if (!player.value || replayCount.value >= props.maxReplays || isPlaying.value) {
    return
  }
  replayCount.value++
  await playClip()
}

onMounted(async () => {
  try {
    player.value = await createPlayer(playerContainerId, props.videoId, {
      onError: () => emit('error', 'YouTube 影片載入失敗'),
    })
  }
  catch {
    emit('error', 'YouTube 播放器初始化失敗')
  }
})

onUnmounted(() => {
  clearClipTimer()
  player.value?.destroy()
})

watch(() => props.videoId, () => {
  replayCount.value = 0
  hasStarted.value = false
  isPlaying.value = false
  clearClipTimer()
})
</script>

<template>
  <div class="flex flex-col items-center gap-3">
    <div :id="playerContainerId" class="sr-only" aria-hidden="true" />

    <AppButton
      v-if="!hasStarted"
      aria-label="播放 YouTube 音樂片段"
      @click="handlePlay"
    >
      ▶ 播放片段
    </AppButton>

    <template v-else>
      <p class="text-sm text-indigo-300">
        {{ isPlaying ? '播放中...' : '播放完畢' }}
      </p>
      <AppButton
        variant="secondary"
        :disabled="replayCount >= maxReplays || isPlaying"
        aria-label="重播 YouTube 音樂片段"
        @click="handleReplay"
      >
        重播（{{ maxReplays - replayCount }} 次）
      </AppButton>
    </template>
  </div>
</template>
