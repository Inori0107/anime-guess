export const useRoomNavigation = (code: Ref<string> | ComputedRef<string>) => {
  const route = useRoute()
  const router = useRouter()
  const roomCode = isRef(code) ? code : computed(() => code)

  const lobbyPath = computed(() => `/room/${roomCode.value}`)
  const playPath = computed(() => `/room/${roomCode.value}/play`)
  const resultPath = computed(() => `/room/${roomCode.value}/result`)

  const navigateTo = (path: string) => {
    if (route.path !== path) {
      router.push(path)
    }
  }

  const syncLobbyRoute = (status: string | undefined) => {
    if (!status) {
      return
    }
    if (status === 'playing' || status === 'revealing' || status === 'generating') {
      navigateTo(playPath.value)
    }
    if (status === 'finished') {
      navigateTo(resultPath.value)
    }
  }

  const syncPlayRoute = (status: string | undefined) => {
    if (!status) {
      return
    }
    if (status === 'lobby') {
      navigateTo(lobbyPath.value)
    }
    if (status === 'finished') {
      navigateTo(resultPath.value)
    }
  }

  return { syncLobbyRoute, syncPlayRoute }
}
