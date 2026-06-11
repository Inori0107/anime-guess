<script setup lang="ts">
import { extractYouTubeVideoId } from '#shared/utils/mediaUrl'
import type { PublicChoice, SongPrompt } from '#shared/types/game'

const props = defineProps<{
  prompt: SongPrompt
  choices: PublicChoice[]
  selectedId: string | null
  disabled?: boolean
}>()

const emit = defineEmits<{
  select: [choiceId: string]
}>()

const audioRef = ref<HTMLAudioElement | null>(null)
const replayCount = ref(0)
const maxReplays = 3
const isPlaying = ref(false)
const loadError = ref<string | null>(null)
const hasStarted = ref(false)
const useProxy = ref(false)

const youtubeVideoId = computed(() => extractYouTubeVideoId(props.prompt.audioUrl))
const isYouTube = computed(() => youtubeVideoId.value !== null)

const audioSrc = computed(() => {
  if (useProxy.value) {
    return `/api/audio/proxy?url=${encodeURIComponent(props.prompt.audioUrl)}`
  }
  return props.prompt.audioUrl
})

const playClip = async () => {
  if (!audioRef.value) {
    return
  }

  loadError.value = null
  audioRef.value.currentTime = props.prompt.clipStartSec

  try {
    await audioRef.value.play()
    isPlaying.value = true
    hasStarted.value = true
  }
  catch {
    loadError.value = '無法播放，請再按一次播放按鈕'
    isPlaying.value = false
  }
}

const handleReplay = async () => {
  if (!audioRef.value || replayCount.value >= maxReplays) {
    return
  }
  replayCount.value++
  await playClip()
}

const handleTimeUpdate = () => {
  if (!audioRef.value) {
    return
  }
  const end = props.prompt.clipStartSec + props.prompt.clipDurationSec
  if (audioRef.value.currentTime >= end) {
    audioRef.value.pause()
    isPlaying.value = false
  }
}

const handleAudioError = () => {
  if (!useProxy.value) {
    useProxy.value = true
    loadError.value = null
    return
  }
  loadError.value = '音訊載入失敗，請按重播或稍後再試'
  isPlaying.value = false
}

const handleYouTubeError = (message: string) => {
  loadError.value = message
  isPlaying.value = false
}

watch(useProxy, async (proxy) => {
  if (proxy && hasStarted.value) {
    await nextTick()
    await playClip()
  }
})

watch(() => props.prompt.audioUrl, () => {
  replayCount.value = 0
  hasStarted.value = false
  isPlaying.value = false
  loadError.value = null
  useProxy.value = false
})
</script>

<template>
  <div class="space-y-4">
    <div class="rounded-xl border border-white/10 bg-black/30 p-4 text-center">
      <p class="mb-3 text-sm text-slate-400">
        聽片段猜歌曲（{{ prompt.clipDurationSec }} 秒）
      </p>

      <YouTubeClipPlayer
        v-if="isYouTube && youtubeVideoId"
        :video-id="youtubeVideoId"
        :clip-start-sec="prompt.clipStartSec"
        :clip-duration-sec="prompt.clipDurationSec"
        :max-replays="maxReplays"
        @error="handleYouTubeError"
      />

      <template v-else>
        <audio
          ref="audioRef"
          :key="audioSrc"
          :src="audioSrc"
          preload="auto"
          crossorigin="anonymous"
          class="sr-only"
          aria-label="歌曲片段"
          @timeupdate="handleTimeUpdate"
          @ended="isPlaying = false"
          @error="handleAudioError"
        />

        <div class="flex flex-col items-center gap-3">
          <AppButton
            v-if="!hasStarted"
            aria-label="播放音樂片段"
            @click="playClip"
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
              aria-label="重播音樂片段"
              @click="handleReplay"
            >
              重播（{{ maxReplays - replayCount }} 次）
            </AppButton>
          </template>
        </div>
      </template>

      <p v-if="loadError" class="mt-2 text-sm text-rose-400" role="alert">
        {{ loadError }}
      </p>
      <p v-if="prompt.animeName" class="mt-2 text-xs text-slate-500">
        提示：來自 {{ prompt.animeName }}
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
