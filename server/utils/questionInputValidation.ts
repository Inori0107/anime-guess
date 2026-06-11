import type { ManualQuestionInput } from '#shared/types/game'

export const QUESTION_BANK_LIMITS = {
  maxQuestionsPerRequest: 10,
  maxLabelLength: 200,
  maxQuoteLength: 500,
  maxUrlLength: 2048,
} as const

const trimLabel = (value: string, maxLength: number, field: string): string => {
  const trimmed = value.trim()
  if (!trimmed) {
    throw new Error(`${field} 不可為空`)
  }
  if (trimmed.length > maxLength) {
    throw new Error(`${field} 不可超過 ${maxLength} 字`)
  }
  return trimmed
}

const trimUrl = (value: string, field: string): string => {
  const trimmed = value.trim()
  if (!trimmed) {
    throw new Error(`${field} 不可為空`)
  }
  if (trimmed.length > QUESTION_BANK_LIMITS.maxUrlLength) {
    throw new Error(`${field} 過長`)
  }
  return trimmed
}

const validateWrongOptions = (wrong: [string, string, string]): [string, string, string] => [
  trimLabel(wrong[0], QUESTION_BANK_LIMITS.maxLabelLength, '錯誤選項 1'),
  trimLabel(wrong[1], QUESTION_BANK_LIMITS.maxLabelLength, '錯誤選項 2'),
  trimLabel(wrong[2], QUESTION_BANK_LIMITS.maxLabelLength, '錯誤選項 3'),
]

export const validateManualQuestions = (questions: ManualQuestionInput[]): ManualQuestionInput[] => {
  if (questions.length === 0) {
    throw new Error('請提供至少一題')
  }

  if (questions.length > QUESTION_BANK_LIMITS.maxQuestionsPerRequest) {
    throw new Error(`一次最多新增 ${QUESTION_BANK_LIMITS.maxQuestionsPerRequest} 題`)
  }

  return questions.map((input) => {
    if (input.type === 'song' && input.song) {
      return {
        type: 'song',
        song: {
          audioUrl: trimUrl(input.song.audioUrl, '音檔 URL'),
          correct: trimLabel(input.song.correct, QUESTION_BANK_LIMITS.maxLabelLength, '正確選項'),
          wrong: validateWrongOptions(input.song.wrong),
        },
      }
    }

    if (input.type === 'character' && input.character) {
      return {
        type: 'character',
        character: {
          imageUrl: trimUrl(input.character.imageUrl, '圖片 URL'),
          correct: trimLabel(input.character.correct, QUESTION_BANK_LIMITS.maxLabelLength, '正確角色名'),
          wrong: validateWrongOptions(input.character.wrong),
        },
      }
    }

    if (input.type === 'quote' && input.quote) {
      return {
        type: 'quote',
        quote: {
          quote: trimLabel(input.quote.quote, QUESTION_BANK_LIMITS.maxQuoteLength, '台詞'),
          answerKind: input.quote.answerKind,
          correct: trimLabel(input.quote.correct, QUESTION_BANK_LIMITS.maxLabelLength, '正確選項'),
          wrong: validateWrongOptions(input.quote.wrong),
        },
      }
    }

    throw new Error('題目格式不正確')
  })
}
