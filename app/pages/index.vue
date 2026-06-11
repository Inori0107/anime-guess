<script setup lang="ts">
useHead({ title: '動漫猜謎' })
</script>

<template>
  <div class="mx-auto max-w-lg space-y-8 text-center">
    <div>
      <h1 class="mb-3 text-4xl font-bold text-white">
        動漫猜謎
      </h1>
      <p class="text-slate-400">
        猜歌、猜角色、猜台詞 — 開房與好友同時搶答！
      </p>
    </div>

    <AppCard class="space-y-4">
      <NuxtLink to="/host" class="block">
        <AppButton class="w-full" aria-label="我要開房">
          我要開房
        </AppButton>
      </NuxtLink>
      <NuxtLink to="/join" class="block">
        <AppButton variant="secondary" class="w-full" aria-label="加入房間">
          加入房間
        </AppButton>
      </NuxtLink>
    </AppCard>

    <div class="grid grid-cols-3 gap-3 text-left text-sm">
      <div class="rounded-xl border border-white/10 bg-white/5 p-3">
        <p class="font-semibold text-indigo-300">猜歌</p>
        <p class="text-slate-400">聽片段四選一</p>
      </div>
      <div class="rounded-xl border border-white/10 bg-white/5 p-3">
        <p class="font-semibold text-indigo-300">猜角色</p>
        <p class="text-slate-400">模糊圖三階提示</p>
      </div>
      <div class="rounded-xl border border-white/10 bg-white/5 p-3">
        <p class="font-semibold text-indigo-300">猜台詞</p>
        <p class="text-slate-400">台詞猜角色/作品</p>
      </div>
    </div>
  </div>
</template>
