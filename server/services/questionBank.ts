import type { ManualQuestionInput, Question, QuestionType } from '#shared/types/game'
import type {
  CharacterBankEntry,
  QuoteBankEntry,
  QuestionBankPickOptions,
  QuestionBankStats,
  SongBankEntry,
} from '#shared/types/questionBank'
import { buildChoicesFromLabels } from '../utils/choiceBuilder'
import { manualToBankEntry, isDuplicateEntry } from '../utils/manualToBankEntry'
import { getPools, insertBankEntries } from '../utils/questionBankDb'
import { generateQuestionId, shuffle } from '../utils/random'

type BankEntry = SongBankEntry | CharacterBankEntry | QuoteBankEntry

const buildSongQuestion = (entry: SongBankEntry): Question => {
  const { choices, correctChoiceId } = buildChoicesFromLabels(entry.correct, entry.distractors)
  return {
    id: generateQuestionId(),
    type: 'song',
    choices,
    correctChoiceId,
    prompt: {
      audioUrl: entry.audioUrl,
      clipStartSec: entry.clipStartSec ?? 0,
      clipDurationSec: entry.clipDurationSec ?? 8,
      animeName: entry.anime?.trim(),
    },
    baseScore: 100,
  }
}

const buildCharacterQuestion = (entry: CharacterBankEntry): Question => {
  const { choices, correctChoiceId } = buildChoicesFromLabels(entry.correct, entry.distractors)
  return {
    id: generateQuestionId(),
    type: 'character',
    choices,
    correctChoiceId,
    prompt: { imageUrl: entry.imageUrl },
    baseScore: 100,
  }
}

const buildQuoteQuestion = (entry: QuoteBankEntry): Question => {
  const { choices, correctChoiceId } = buildChoicesFromLabels(entry.correct, entry.distractors)
  return {
    id: generateQuestionId(),
    type: 'quote',
    choices,
    correctChoiceId,
    prompt: {
      text: entry.quote.trim(),
      answerKind: entry.answerKind,
    },
    baseScore: 100,
  }
}

const entryToQuestion = (entry: BankEntry): Question => {
  if ('audioUrl' in entry) {
    return buildSongQuestion(entry)
  }
  if ('imageUrl' in entry) {
    return buildCharacterQuestion(entry)
  }
  return buildQuoteQuestion(entry)
}

const distributeTypes = (types: QuestionType[], count: number): QuestionType[] => {
  const result: QuestionType[] = []
  for (let i = 0; i < count; i++) {
    result.push(types[i % types.length]!)
  }
  return shuffle(result)
}

const pickFromPool = <T extends { id: string }>(
  pool: T[],
  count: number,
  usedIds: Set<string>,
): T[] => {
  const available = shuffle(pool.filter(item => !usedIds.has(item.id)))
  const picked: T[] = []

  for (const item of available) {
    if (picked.length >= count) {
      break
    }
    picked.push(item)
    usedIds.add(item.id)
  }

  if (picked.length < count) {
    for (const item of shuffle(pool)) {
      if (picked.length >= count) {
        break
      }
      if (!picked.includes(item)) {
        picked.push(item)
      }
    }
  }

  return picked
}

const countByType = (types: QuestionType[], target: QuestionType): number =>
  types.filter(t => t === target).length

export const getQuestionBankStats = async (): Promise<QuestionBankStats> => {
  const pools = await getPools()
  const { songs, characters, quotes } = pools
  return {
    songs: songs.length,
    characters: characters.length,
    quotes: quotes.length,
    total: songs.length + characters.length + quotes.length,
  }
}

export const addManualQuestionsToBank = async (
  inputs: ManualQuestionInput[],
): Promise<{ added: number; skipped: number; stats: QuestionBankStats }> => {
  const pools = await getPools()
  let added = 0
  let skipped = 0

  const newEntries: BankEntry[] = []

  for (const input of inputs) {
    const entry = manualToBankEntry(input)
    if (!entry || isDuplicateEntry(pools, entry)) {
      skipped++
      continue
    }
    newEntries.push(entry)
    added++
  }

  if (newEntries.length > 0) {
    await insertBankEntries(newEntries)
  }

  return { added, skipped, stats: await getQuestionBankStats() }
}

export const pickQuestionsFromBank = async (
  options: QuestionBankPickOptions,
): Promise<Question[]> => {
  const pools = await getPools()
  const typeList = distributeTypes(options.types, options.count)
  const usedIds = new Set<string>()

  const pickedByType = {
    song: pickFromPool(pools.songs, countByType(typeList, 'song'), usedIds),
    character: pickFromPool(pools.characters, countByType(typeList, 'character'), usedIds),
    quote: pickFromPool(pools.quotes, countByType(typeList, 'quote'), usedIds),
  }

  const cursor = { song: 0, character: 0, quote: 0 }
  const questions: Question[] = []

  for (const type of typeList) {
    const entry = pickedByType[type][cursor[type]]
    if (entry) {
      questions.push(entryToQuestion(entry))
      cursor[type]++
    }
  }

  return questions
}

export const buildManualQuestions = (inputs: ManualQuestionInput[]): Question[] =>
  inputs
    .map(input => manualToBankEntry(input))
    .filter((entry): entry is BankEntry => entry !== null)
    .map(entryToQuestion)
