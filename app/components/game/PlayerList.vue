<script setup lang="ts">
import type { PublicPlayer } from '#shared/types/room'

defineProps<{
  players: PublicPlayer[]
  maxPlayers?: number
}>()
</script>

<template>
  <ul class="space-y-2" aria-label="玩家列表">
    <li
      v-for="player in players"
      :key="player.id"
      class="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3"
    >
      <div class="flex items-center gap-2">
        <span
          class="h-2 w-2 rounded-full"
          :class="player.connected ? 'bg-emerald-400' : 'bg-slate-500'"
          :aria-label="player.connected ? '在線' : '離線'"
        />
        <span class="font-medium text-white">{{ player.nickname }}</span>
        <span
          v-if="player.isHost"
          class="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-300"
        >
          主辦
        </span>
      </div>
      <span class="text-sm text-slate-400">{{ player.score }} 分</span>
    </li>
  </ul>
  <p v-if="maxPlayers" class="mt-3 text-center text-sm text-slate-400">
    {{ players.length }} / {{ maxPlayers }} 人
  </p>
</template>
