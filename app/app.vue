<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/40 to-slate-950">
    <NuxtRouteAnnouncer />
    <header class="border-b border-white/10 bg-black/20 backdrop-blur-sm">
      <div class="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
        <NuxtLink
          to="/"
          class="text-lg font-bold tracking-tight text-white transition hover:text-indigo-300"
          aria-label="回到首頁"
        >
          動漫猜謎
        </NuxtLink>
        <span class="text-xs text-slate-400">Nuxt 全端多人搶答</span>
      </div>
    </header>
    <main class="mx-auto max-w-4xl px-4 py-8">
      <NuxtPage />
    </main>
  </div>
</template>
