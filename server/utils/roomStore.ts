import type { PublicQuestion, Question } from '#shared/types/game'
import { HINT_SCORE_MULTIPLIERS } from '#shared/types/game'
import type {
  CreateRoomBody,
  JoinRoomBody,
  Player,
  PlayerAnswer,
  PublicRoomState,
  Room,
  RoundRevealData,
  WsEvent,
} from '#shared/types/room'
import { buildManualQuestions, pickQuestionsFromBank } from '../services/questionBank'
import { broadcastToRoom } from './wsHub'

const rooms = new Map<string, Room>()
const playerSessions = new Map<string, { code: string; playerId: string }>()
const roundTimers = new Map<string, ReturnType<typeof setTimeout>>()

const ROOM_TTL_MS = 2 * 60 * 60 * 1000
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

const generateCode = (): string => {
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  }
  if (rooms.has(code)) {
    return generateCode()
  }
  return code
}

const generatePlayerId = () => crypto.randomUUID()

export const toPublicRoomState = (room: Room): PublicRoomState => {
  const currentQuestion = room.status === 'playing' || room.status === 'revealing'
    ? toPublicQuestion(room)
    : null

  const answeredCount = room.roundAnswers.length

  return {
    code: room.code,
    hostType: room.hostType,
    hostId: room.hostId,
    status: room.status,
    players: room.players.map(p => ({
      id: p.id,
      nickname: p.nickname,
      score: p.score,
      isHost: p.isHost,
      connected: p.connected,
    })),
    currentIndex: room.currentIndex,
    totalQuestions: room.questions.length,
    roundDeadline: room.roundDeadline,
    answeredCount,
    settings: room.settings,
    currentQuestion,
    revealData: room.revealData,
  }
}

const toPublicQuestion = (room: Room): PublicQuestion | null => {
  const question = room.questions[room.currentIndex]
  if (!question) {
    return null
  }

  return {
    id: question.id,
    type: question.type,
    choices: question.choices.map(c => ({ id: c.id, display: c.display })),
    prompt: question.prompt,
    index: room.currentIndex + 1,
    total: room.questions.length,
  }
}

const emit = (room: Room, event: WsEvent) => {
  broadcastToRoom(room.code, event)
}

const clearRoundTimer = (code: string) => {
  const timer = roundTimers.get(code)
  if (timer) {
    clearTimeout(timer)
    roundTimers.delete(code)
  }
}

const scheduleRoundEnd = (room: Room) => {
  clearRoundTimer(room.code)
  if (!room.roundDeadline) {
    return
  }

  const delay = Math.max(0, room.roundDeadline - Date.now())
  const timer = setTimeout(() => {
    revealRound(room.code)
  }, delay)
  roundTimers.set(room.code, timer)
}

const resetPlayerRoundState = (room: Room) => {
  for (const player of room.players) {
    player.hintStage = 0
  }
  room.roundAnswers = []
  room.revealData = null
}

const startRound = (room: Room) => {
  resetPlayerRoundState(room)
  room.status = 'playing'
  room.roundDeadline = Date.now() + room.settings.roundSeconds * 1000

  const question = toPublicQuestion(room)
  if (!question) {
    room.status = 'finished'
    endGame(room)
    return
  }

  emit(room, {
    type: 'room:round_start',
    payload: { question, roundDeadline: room.roundDeadline },
  })
  emit(room, { type: 'room:state', payload: toPublicRoomState(room) })
  scheduleRoundEnd(room)
}

const endGame = (room: Room) => {
  room.status = 'finished'
  clearRoundTimer(room.code)
  const leaderboard = [...room.players]
    .sort((a, b) => b.score - a.score)
    .map(p => ({ playerId: p.id, nickname: p.nickname, score: p.score }))

  emit(room, { type: 'room:game_end', payload: { leaderboard } })
  emit(room, { type: 'room:state', payload: toPublicRoomState(room) })
}

export const revealRound = (code: string): RoundRevealData | null => {
  const room = rooms.get(code)
  if (!room || room.status !== 'playing') {
    return null
  }

  clearRoundTimer(code)
  room.status = 'revealing'

  const question = room.questions[room.currentIndex]
  if (!question) {
    return null
  }

  const correctChoice = question.choices.find(c => c.id === question.correctChoiceId)

  const playerResults = room.players.map((player) => {
    const answer = room.roundAnswers.find(a => a.playerId === player.id)
    const choice = answer
      ? question.choices.find(c => c.id === answer.choiceId)
      : null

    return {
      playerId: player.id,
      nickname: player.nickname,
      choiceId: answer?.choiceId ?? null,
      choiceDisplay: choice?.display ?? null,
      isCorrect: answer?.isCorrect ?? false,
      earnedScore: answer?.earnedScore ?? 0,
      totalScore: player.score,
    }
  })

  const revealData: RoundRevealData = {
    correctChoiceId: question.correctChoiceId,
    correctDisplay: correctChoice?.display ?? '',
    playerResults,
  }

  room.revealData = revealData
  room.roundHistory.push(...room.roundAnswers)

  emit(room, { type: 'room:round_reveal', payload: revealData })
  emit(room, { type: 'room:state', payload: toPublicRoomState(room) })

  setTimeout(() => {
    advanceToNextRound(code)
  }, 4000)

  return revealData
}

const advanceToNextRound = (code: string) => {
  const room = rooms.get(code)
  if (!room) {
    return
  }

  room.currentIndex++
  room.revealData = null

  if (room.currentIndex >= room.questions.length) {
    endGame(room)
    return
  }

  startRound(room)
}

const checkAllAnswered = (room: Room): boolean => {
  return room.roundAnswers.length >= room.players.length
}

export const createRoom = (body: CreateRoomBody): { room: Room; playerId: string } => {
  const code = generateCode()
  const playerId = generatePlayerId()

  const player: Player = {
    id: playerId,
    nickname: body.nickname.trim() || '主辦方',
    score: 0,
    isHost: true,
    connected: true,
    hintStage: 0,
  }

  const room: Room = {
    code,
    hostType: body.hostType,
    hostId: playerId,
    status: 'lobby',
    players: [player],
    questions: [],
    manualQuestions: body.manualQuestions,
    currentIndex: 0,
    roundDeadline: null,
    roundAnswers: [],
    roundHistory: [],
    settings: {
      types: body.settings.types,
      count: body.settings.count,
      roundSeconds: body.settings.roundSeconds ?? 20,
      minPlayers: 1,
      maxPlayers: 6,
    },
    revealData: null,
    createdAt: Date.now(),
  }

  rooms.set(code, room)
  playerSessions.set(playerId, { code, playerId })

  return { room, playerId }
}

export const joinRoom = (
  body: JoinRoomBody,
): { room: Room; playerId: string } | { error: string; status: number } => {
  const code = body.code.trim().toUpperCase()
  const room = rooms.get(code)

  if (!room) {
    return { error: '找不到房間', status: 404 }
  }

  if (room.status !== 'lobby') {
    return { error: '遊戲已開始，無法加入', status: 400 }
  }

  if (room.players.length >= room.settings.maxPlayers) {
    return { error: '房間已滿（最多 6 人）', status: 403 }
  }

  const nickname = body.nickname.trim()
  if (!nickname) {
    return { error: '請輸入暱稱', status: 400 }
  }

  if (room.players.some(p => p.nickname === nickname)) {
    return { error: '暱稱已被使用', status: 400 }
  }

  const playerId = generatePlayerId()
  const player: Player = {
    id: playerId,
    nickname,
    score: 0,
    isHost: false,
    connected: true,
    hintStage: 0,
  }

  room.players.push(player)
  playerSessions.set(playerId, { code, playerId })

  emit(room, {
    type: 'room:player_joined',
    payload: {
      players: room.players.map(p => ({
        id: p.id,
        nickname: p.nickname,
        score: p.score,
        isHost: p.isHost,
        connected: p.connected,
      })),
    },
  })
  emit(room, { type: 'room:state', payload: toPublicRoomState(room) })

  return { room, playerId }
}

export const getRoom = (code: string): Room | undefined => {
  return rooms.get(code.toUpperCase())
}

export const setPlayerConnected = (code: string, playerId: string, connected: boolean) => {
  const room = rooms.get(code)
  if (!room) {
    return
  }
  const player = room.players.find(p => p.id === playerId)
  if (player) {
    player.connected = connected
    emit(room, { type: 'room:state', payload: toPublicRoomState(room) })
  }
}

export const startGame = async (
  code: string,
  playerId: string,
): Promise<{ ok: true } | { error: string; status: number }> => {
  const room = rooms.get(code)
  if (!room) {
    return { error: '找不到房間', status: 404 }
  }

  if (room.hostId !== playerId) {
    return { error: '只有主辦方可以開始遊戲', status: 403 }
  }

  if (room.status !== 'lobby') {
    return { error: '遊戲已開始', status: 400 }
  }

  room.status = 'generating'
  emit(room, { type: 'room:generating', payload: { message: '出題中，請稍候...' } })
  emit(room, { type: 'room:state', payload: toPublicRoomState(room) })

  try {
    let questions: Question[] = []

    if (room.hostType === 'system') {
      questions = await pickQuestionsFromBank({
        types: room.settings.types,
        count: room.settings.count,
      })
    }
    else if (room.manualQuestions?.length) {
      questions = buildManualQuestions(room.manualQuestions)
    }
    else {
      room.status = 'lobby'
      emit(room, { type: 'room:state', payload: toPublicRoomState(room) })
      return { error: '請先建立題目', status: 400 }
    }

    if (questions.length === 0) {
      room.status = 'lobby'
      emit(room, { type: 'room:state', payload: toPublicRoomState(room) })
      return { error: '出題失敗，請稍後再試', status: 500 }
    }

    room.questions = questions
    room.currentIndex = 0
    startRound(room)
    return { ok: true }
  }
  catch {
    room.status = 'lobby'
    return { error: '出題失敗', status: 500 }
  }
}

export const submitAnswer = (
  code: string,
  playerId: string,
  choiceId: string,
  hintStageUsed?: number,
): { ok: true } | { error: string; status: number } => {
  const room = rooms.get(code)
  if (!room || room.status !== 'playing') {
    return { error: '目前無法作答', status: 400 }
  }

  if (room.roundDeadline && Date.now() > room.roundDeadline) {
    return { error: '作答時間已結束', status: 400 }
  }

  const player = room.players.find(p => p.id === playerId)
  if (!player) {
    return { error: '找不到玩家', status: 404 }
  }

  const question = room.questions[room.currentIndex]
  if (!question) {
    return { error: '找不到題目', status: 404 }
  }

  const isCorrect = choiceId === question.correctChoiceId
  const hintStage = hintStageUsed ?? player.hintStage
  const multiplier = question.type === 'character'
    ? (HINT_SCORE_MULTIPLIERS[hintStage] ?? 0.25)
    : 1
  const earnedScore = isCorrect ? Math.round(question.baseScore * multiplier) : 0

  const existingIndex = room.roundAnswers.findIndex(a => a.playerId === playerId)
  const answer: PlayerAnswer = {
    playerId,
    questionId: question.id,
    choiceId,
    hintStageUsed: hintStage,
    isCorrect,
    earnedScore,
    answeredAt: Date.now(),
  }

  if (existingIndex >= 0) {
    const previous = room.roundAnswers[existingIndex]!
    player.score -= previous.earnedScore
    room.roundAnswers[existingIndex] = answer
  }
  else {
    room.roundAnswers.push(answer)
  }

  player.score += earnedScore

  emit(room, {
    type: 'room:player_answered',
    payload: { answeredCount: room.roundAnswers.length, total: room.players.length },
  })
  emit(room, { type: 'room:state', payload: toPublicRoomState(room) })

  if (checkAllAnswered(room)) {
    revealRound(code)
  }

  return { ok: true }
}

export const useHint = (
  code: string,
  playerId: string,
): { hintStage: number } | { error: string; status: number } => {
  const room = rooms.get(code)
  if (!room || room.status !== 'playing') {
    return { error: '目前無法使用提示', status: 400 }
  }

  const question = room.questions[room.currentIndex]
  if (!question || question.type !== 'character') {
    return { error: '此題目不支援提示', status: 400 }
  }

  const player = room.players.find(p => p.id === playerId)
  if (!player) {
    return { error: '找不到玩家', status: 404 }
  }

  if (player.hintStage >= 3) {
    return { hintStage: 3 }
  }

  player.hintStage++
  return { hintStage: player.hintStage }
}

export const getResult = (code: string) => {
  const room = rooms.get(code)
  if (!room) {
    return null
  }

  const leaderboard = [...room.players]
    .sort((a, b) => b.score - a.score)
    .map(p => ({
      playerId: p.id,
      nickname: p.nickname,
      score: p.score,
      isHost: p.isHost,
    }))

  return {
    code: room.code,
    leaderboard,
    history: room.roundHistory,
    totalQuestions: room.questions.length,
  }
}

setInterval(() => {
  const now = Date.now()
  for (const [code, room] of rooms) {
    if (now - room.createdAt > ROOM_TTL_MS) {
      clearRoundTimer(code)
      rooms.delete(code)
      for (const [pid, session] of playerSessions) {
        if (session.code === code) {
          playerSessions.delete(pid)
        }
      }
    }
  }
}, 60_000)
