import type { ManualQuestionInput } from '#shared/types/game'
import type {
  CharacterBankEntry,
  QuoteBankEntry,
  SongBankEntry,
} from '#shared/types/questionBank'

export type BankEntry = SongBankEntry | CharacterBankEntry | QuoteBankEntry

const toLabel = (value: string): string => {
  const label = value.trim()
  if (!label) {
    throw new Error('標籤不可為空')
  }
  return label
}

const toDistractors = (wrong: [string, string, string]): [string, string, string] => [
  toLabel(wrong[0]),
  toLabel(wrong[1]),
  toLabel(wrong[2]),
]

const createBankEntryId = (type: string): string =>
  `player-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

export const manualToBankEntry = (
  input: ManualQuestionInput,
  id = createBankEntryId(input.type),
): BankEntry | null => {
  if (input.type === 'song' && input.song) {
    return {
      id,
      audioUrl: input.song.audioUrl.trim(),
      clipStartSec: 0,
      clipDurationSec: 8,
      anime: '玩家出題',
      correct: toLabel(input.song.correct),
      distractors: toDistractors(input.song.wrong),
    }
  }

  if (input.type === 'character' && input.character) {
    return {
      id,
      imageUrl: input.character.imageUrl.trim(),
      correct: toLabel(input.character.correct),
      distractors: toDistractors(input.character.wrong),
    }
  }

  if (input.type === 'quote' && input.quote) {
    return {
      id,
      quote: toLabel(input.quote.quote),
      answerKind: input.quote.answerKind,
      correct: toLabel(input.quote.correct),
      distractors: toDistractors(input.quote.wrong),
    }
  }

  return null
}

export const isDuplicateEntry = (
  pools: { songs: SongBankEntry[]; characters: CharacterBankEntry[]; quotes: QuoteBankEntry[] },
  entry: BankEntry,
): boolean => {
  if ('audioUrl' in entry) {
    return pools.songs.some(s => s.audioUrl === entry.audioUrl)
  }
  if ('imageUrl' in entry) {
    return pools.characters.some(c => c.imageUrl === entry.imageUrl)
  }
  return pools.quotes.some(q =>
    q.quote === entry.quote
    && q.answerKind === entry.answerKind,
  )
}
