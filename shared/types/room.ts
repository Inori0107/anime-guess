import type { ManualQuestionInput, PublicQuestion, Question, QuestionType } from './game'

export type HostType = 'player' | 'system'

export type RoomStatus = 'lobby' | 'generating' | 'playing' | 'revealing' | 'finished'

export type Player = {
  id: string
  nickname: string
  score: number
  isHost: boolean
  connected: boolean
  hintStage: number
}

export type PlayerAnswer = {
  playerId: string
  questionId: string
  choiceId: string
  hintStageUsed: number
  isCorrect: boolean
  earnedScore: number
  answeredAt: number
}

export type RoomSettings = {
  types: QuestionType[]
  count: number
  roundSeconds: number
  minPlayers: number
  maxPlayers: number
}

export type Room = {
  code: string
  hostType: HostType
  hostId: string
  status: RoomStatus
  players: Player[]
  questions: Question[]
  manualQuestions?: ManualQuestionInput[]
  currentIndex: number
  roundDeadline: number | null
  roundAnswers: PlayerAnswer[]
  roundHistory: PlayerAnswer[]
  settings: RoomSettings
  revealData: RoundRevealData | null
  createdAt: number
}

export type RoundRevealData = {
  correctChoiceId: string
  correctDisplay: string
  playerResults: Array<{
    playerId: string
    nickname: string
    choiceId: string | null
    choiceDisplay: string | null
    isCorrect: boolean
    earnedScore: number
    totalScore: number
  }>
}

export type PublicPlayer = Pick<Player, 'id' | 'nickname' | 'score' | 'isHost' | 'connected'>

export type PublicRoomState = {
  code: string
  hostType: HostType
  hostId: string
  status: RoomStatus
  players: PublicPlayer[]
  currentIndex: number
  totalQuestions: number
  roundDeadline: number | null
  answeredCount: number
  settings: RoomSettings
  currentQuestion: PublicQuestion | null
  revealData: RoundRevealData | null
}

export type WsEvent =
  | { type: 'room:state'; payload: PublicRoomState }
  | { type: 'room:player_joined'; payload: { players: PublicPlayer[] } }
  | { type: 'room:player_left'; payload: { players: PublicPlayer[] } }
  | { type: 'room:generating'; payload: { message: string } }
  | { type: 'room:round_start'; payload: { question: PublicQuestion; roundDeadline: number } }
  | { type: 'room:player_answered'; payload: { answeredCount: number; total: number } }
  | { type: 'room:round_reveal'; payload: RoundRevealData }
  | { type: 'room:game_end'; payload: { leaderboard: Array<{ playerId: string; nickname: string; score: number }> } }

export type CreateRoomBody = {
  hostType: HostType
  nickname: string
  settings: {
    types: QuestionType[]
    count: number
    roundSeconds?: number
  }
  manualQuestions?: ManualQuestionInput[]
}

export type JoinRoomBody = {
  code: string
  nickname: string
}
