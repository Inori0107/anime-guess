import type { QuestionType } from '../types/game'

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  song: '猜歌',
  character: '猜角色',
  quote: '猜台詞',
}

export const QUESTION_TYPE_OPTIONS: { value: QuestionType; label: string }[] = [
  { value: 'song', label: QUESTION_TYPE_LABELS.song },
  { value: 'character', label: QUESTION_TYPE_LABELS.character },
  { value: 'quote', label: QUESTION_TYPE_LABELS.quote },
]
