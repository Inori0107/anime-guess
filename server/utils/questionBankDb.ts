import type {
  CharacterBankEntry,
  QuoteBankEntry,
  QuestionType,
  SongBankEntry,
} from '#shared/types/questionBank'
import type { BankEntry } from './manualToBankEntry'
import { getDb } from '../db/client'

export type QuestionPools = {
  songs: SongBankEntry[]
  characters: CharacterBankEntry[]
  quotes: QuoteBankEntry[]
}

type QuestionRow = {
  id: string
  type: QuestionType
  payload: Record<string, unknown>
  created_at: Date
}

let cachedPools: QuestionPools | null = null

const requireDb = () => {
  const db = getDb()
  if (!db) {
    throw createError({
      statusCode: 503,
      message: 'DATABASE_URL 未設定，請設定 Supabase 連線字串',
    })
  }
  return db
}

const rowToEntry = (row: QuestionRow): BankEntry =>
  ({ id: row.id, ...row.payload }) as BankEntry

const entryType = (entry: BankEntry): QuestionType =>
  'audioUrl' in entry ? 'song' : 'imageUrl' in entry ? 'character' : 'quote'

const entryPreview = (type: QuestionType, payload: Record<string, unknown>, correct: string): string => {
  if (type === 'song') {
    return String(payload.anime ?? payload.audioUrl ?? correct)
  }
  if (type === 'character') {
    return String(payload.imageUrl ?? correct)
  }
  return String(payload.quote ?? correct)
}

const invalidatePoolCache = (): void => {
  cachedPools = null
}

export const getPools = async (): Promise<QuestionPools> => {
  if (cachedPools) {
    return cachedPools
  }

  const db = requireDb()
  const rows = await db<QuestionRow[]>`
    SELECT id, type, payload, created_at
    FROM question_bank
    ORDER BY created_at ASC
  `

  const pools: QuestionPools = { songs: [], characters: [], quotes: [] }

  for (const row of rows) {
    const entry = rowToEntry(row)
    if (row.type === 'song') {
      pools.songs.push(entry as SongBankEntry)
    }
    else if (row.type === 'character') {
      pools.characters.push(entry as CharacterBankEntry)
    }
    else {
      pools.quotes.push(entry as QuoteBankEntry)
    }
  }

  cachedPools = pools
  return pools
}

export const insertBankEntries = async (entries: BankEntry[]): Promise<void> => {
  if (entries.length === 0) {
    return
  }

  const db = requireDb()

  for (const entry of entries) {
    const { id, ...payload } = entry
    await db`
      INSERT INTO question_bank (id, type, payload)
      VALUES (${id}, ${entryType(entry)}, ${db.json(payload)})
      ON CONFLICT (id) DO NOTHING
    `
  }

  invalidatePoolCache()
}

export type QuestionListItem = {
  id: string
  type: QuestionType
  preview: string
  correct: string
  createdAt: string
}

export const listQuestions = async (): Promise<QuestionListItem[]> => {
  const db = requireDb()

  const rows = await db<QuestionRow[]>`
    SELECT id, type, payload, created_at
    FROM question_bank
    ORDER BY created_at DESC
  `

  return rows.map((row) => {
    const correct = String(row.payload.correct ?? '')
    return {
      id: row.id,
      type: row.type,
      preview: entryPreview(row.type, row.payload, correct),
      correct,
      createdAt: row.created_at.toISOString(),
    }
  })
}
