export type QuestionType = 'song' | 'character' | 'quote'

export type Choice = {
  id: string
  display: string
}

export type CharacterPrompt = {
  imageUrl: string
}

export type SongPrompt = {
  audioUrl: string
  clipStartSec: number
  clipDurationSec: number
  animeName?: string
}

export type QuotePrompt = {
  text: string
  answerKind: 'character' | 'anime'
}

export type QuestionPrompt = CharacterPrompt | SongPrompt | QuotePrompt

export type Question = {
  id: string
  type: QuestionType
  choices: Choice[]
  correctChoiceId: string
  prompt: QuestionPrompt
  baseScore: number
}

export type PublicChoice = Pick<Choice, 'id' | 'display'>

export type PublicQuestion = {
  id: string
  type: QuestionType
  choices: PublicChoice[]
  prompt: QuestionPrompt
  index: number
  total: number
}

export type ManualQuestionInput = {
  type: QuestionType
  song?: {
    audioUrl: string
    correct: string
    wrong: [string, string, string]
  }
  character?: {
    imageUrl: string
    correct: string
    wrong: [string, string, string]
  }
  quote?: {
    quote: string
    answerKind: 'character' | 'anime'
    correct: string
    wrong: [string, string, string]
  }
}

export const HINT_SCORE_MULTIPLIERS: Record<number, number> = {
  0: 1,
  1: 0.75,
  2: 0.5,
  3: 0.25,
}

export const BLUR_STAGES = [40, 24, 10, 0] as const
