import type { QuestionType } from './game'

export type SongBankEntry = {
  id: string
  audioUrl: string
  clipStartSec?: number
  clipDurationSec?: number
  /** 玩家出題可省略，預設顯示「玩家出題」 */
  anime?: string
  correct: string
  distractors: [string, string, string]
}

export type CharacterBankEntry = {
  id: string
  imageUrl: string
  correct: string
  distractors: [string, string, string]
}

export type QuoteBankEntry = {
  id: string
  quote: string
  answerKind: 'character' | 'anime'
  correct: string
  distractors: [string, string, string]
}

export type QuestionBankStats = {
  songs: number
  characters: number
  quotes: number
  total: number
}

export type QuestionBankPickOptions = {
  types: QuestionType[]
  count: number
}
