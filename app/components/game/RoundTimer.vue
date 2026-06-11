<script setup lang="ts">
const props = defineProps<{
  deadline: number | null
}>()

const remaining = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

const updateRemaining = () => {
  if (!props.deadline) {
    remaining.value = 0
    return
  }
  remaining.value = Math.max(0, Math.ceil((props.deadline - Date.now()) / 1000))
}

watch(() => props.deadline, () => {
  updateRemaining()
}, { immediate: true })

onMounted(() => {
  timer = setInterval(updateRemaining, 200)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<template>
  <div
    class="flex items-center justify-center gap-2 rounded-full border border-white/10 bg-black/30 px-4 py-2"
    role="timer"
    :aria-label="`剩餘 ${remaining} 秒`"
  >
    <span class="text-sm text-slate-400">剩餘</span>
    <span
      class="text-2xl font-bold tabular-nums"
      :class="remaining <= 5 ? 'text-rose-400' : 'text-indigo-300'"
    >
      {{ remaining }}s
    </span>
  </div>
</template>
