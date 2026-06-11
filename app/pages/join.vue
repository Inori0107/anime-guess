<script setup lang="ts">
useHead({ title: '加入房間' })

const code = ref('')
const nickname = ref('')
const error = ref<string | null>(null)
const loading = ref(false)

const { setSession } = useGameSession()
const router = useRouter()

const handleSubmit = async () => {
  error.value = null
  loading.value = true

  try {
    const result = await $fetch<{
      code: string
      playerId: string
      room: { players: Array<{ nickname: string; isHost: boolean }> }
    }>('/api/room/join', {
      method: 'POST',
      body: {
        code: code.value.trim().toUpperCase(),
        nickname: nickname.value.trim(),
      },
    })

    setSession({
      code: result.code,
      playerId: result.playerId,
      nickname: nickname.value.trim(),
      isHost: false,
    })

    await router.push(`/room/${result.code}`)
  }
  catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    error.value = err.data?.message ?? '加入失敗'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-md space-y-6">
    <div class="text-center">
      <h1 class="text-2xl font-bold text-white">
        加入房間
      </h1>
      <p class="text-sm text-slate-400">
        輸入 6 位房號與暱稱
      </p>
    </div>

    <AppCard class="space-y-4">
      <div>
        <label for="room-code" class="mb-1 block text-sm text-slate-300">房號</label>
        <input
          id="room-code"
          v-model="code"
          type="text"
          maxlength="6"
          placeholder="例如 ABC123"
          class="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 uppercase text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
          aria-label="房號"
        >
      </div>
      <div>
        <label for="nickname" class="mb-1 block text-sm text-slate-300">暱稱</label>
        <input
          id="nickname"
          v-model="nickname"
          type="text"
          maxlength="12"
          placeholder="你的暱稱"
          class="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
          aria-label="暱稱"
        >
      </div>

      <p v-if="error" class="text-sm text-rose-400" role="alert">
        {{ error }}
      </p>

      <AppButton
        class="w-full"
        :disabled="loading || !code.trim() || !nickname.trim()"
        aria-label="加入房間"
        @click="handleSubmit"
      >
        {{ loading ? '加入中...' : '加入' }}
      </AppButton>
    </AppCard>

    <NuxtLink to="/" class="block text-center text-sm text-slate-400 hover:text-white">
      返回首頁
    </NuxtLink>
  </div>
</template>
