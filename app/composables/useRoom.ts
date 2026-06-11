import type { PublicRoomState, WsEvent } from '#shared/types/room'

const SESSION_KEY = 'anime_guess_session'

export type GameSession = {
  code: string
  playerId: string
  nickname: string
  isHost: boolean
}

export const useGameSession = () => {
  const getSession = (): GameSession | null => {
    if (!import.meta.client) {
      return null
    }
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) {
      return null
    }
    try {
      return JSON.parse(raw) as GameSession
    }
    catch {
      return null
    }
  }

  const setSession = (session: GameSession) => {
    if (import.meta.client) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
    }
  }

  const clearSession = () => {
    if (import.meta.client) {
      sessionStorage.removeItem(SESSION_KEY)
    }
  }

  return { getSession, setSession, clearSession }
}

export const useRoom = (code: Ref<string> | string) => {
  const roomCode = isRef(code) ? code : ref(code)
  const roomState = ref<PublicRoomState | null>(null)
  const wsConnected = ref(false)
  const lastError = ref<string | null>(null)

  const { getSession } = useGameSession()
  const session = getSession()

  const getWsUrl = () => {
    const config = useRuntimeConfig()
    const base = config.public.wsBase || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`
    const playerId = session?.playerId ?? ''
    return `${base}/ws/room/${roomCode.value}?playerId=${playerId}`
  }

  let ws: WebSocket | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null

  const handleWsEvent = (event: WsEvent) => {
    if (event.type === 'room:state') {
      roomState.value = event.payload
    }
    else if (event.type === 'room:player_joined' || event.type === 'room:player_left') {
      if (roomState.value) {
        roomState.value.players = event.payload.players
      }
    }
    else if (event.type === 'room:generating') {
      if (roomState.value) {
        roomState.value.status = 'generating'
      }
    }
    else if (event.type === 'room:round_start') {
      if (roomState.value) {
        roomState.value.status = 'playing'
        roomState.value.currentQuestion = event.payload.question
        roomState.value.roundDeadline = event.payload.roundDeadline
        roomState.value.revealData = null
        roomState.value.answeredCount = 0
      }
    }
    else if (event.type === 'room:player_answered') {
      if (roomState.value) {
        roomState.value.answeredCount = event.payload.answeredCount
      }
    }
    else if (event.type === 'room:round_reveal') {
      if (roomState.value) {
        roomState.value.status = 'revealing'
        roomState.value.revealData = event.payload
      }
    }
    else if (event.type === 'room:game_end') {
      if (roomState.value) {
        roomState.value.status = 'finished'
      }
    }
  }

  const connectWs = () => {
    if (!import.meta.client) {
      return
    }

    disconnectWs()

    try {
      ws = new WebSocket(getWsUrl())

      ws.onopen = () => {
        wsConnected.value = true
        lastError.value = null
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WsEvent
          handleWsEvent(data)
        }
        catch {
          // ignore invalid messages
        }
      }

      ws.onclose = () => {
        wsConnected.value = false
        reconnectTimer = setTimeout(connectWs, 3000)
      }

      ws.onerror = () => {
        lastError.value = '連線中斷，正在重連...'
      }
    }
    catch {
      lastError.value = '無法建立連線'
    }
  }

  const disconnectWs = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    if (ws) {
      ws.onclose = null
      ws.close()
      ws = null
    }
  }

  const fetchRoom = async () => {
    try {
      roomState.value = await $fetch<PublicRoomState>(`/api/room/${roomCode.value}`)
    }
    catch (e: unknown) {
      const err = e as { data?: { message?: string } }
      lastError.value = err.data?.message ?? '載入房間失敗'
    }
  }

  const startGame = async () => {
    const currentSession = getSession()
    if (!currentSession) {
      return
    }
    await $fetch(`/api/room/${roomCode.value}/start`, {
      method: 'POST',
      body: { playerId: currentSession.playerId },
    })
  }

  const submitAnswer = async (choiceId: string, hintStageUsed?: number) => {
    const currentSession = getSession()
    if (!currentSession) {
      return
    }
    await $fetch(`/api/room/${roomCode.value}/answer`, {
      method: 'POST',
      body: {
        playerId: currentSession.playerId,
        choiceId,
        hintStageUsed,
      },
    })
  }

  const useHint = async (): Promise<number> => {
    const currentSession = getSession()
    if (!currentSession) {
      return 0
    }
    const result = await $fetch<{ hintStage: number }>(`/api/room/${roomCode.value}/hint`, {
      method: 'POST',
      body: { playerId: currentSession.playerId },
    })
    return result.hintStage
  }

  onMounted(() => {
    fetchRoom()
    connectWs()
  })

  onUnmounted(() => {
    disconnectWs()
  })

  return {
    roomState,
    wsConnected,
    lastError,
    startGame,
    submitAnswer,
    useHint,
  }
}
