import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import postgres from 'postgres'
import { QUESTION_BANK_SCHEMA } from '../server/db/schema.mjs'

const resolveDataDir = () => resolve(process.cwd(), 'server/data/questions')

const loadJson = (filename) => {
  const filePath = join(resolveDataDir(), filename)
  return JSON.parse(readFileSync(filePath, 'utf-8'))
}

const run = async () => {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('請設定 DATABASE_URL（或在 .env 中設定後執行 npm run db:import）')
    process.exit(1)
  }

  const isLocal = databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1')
  const sql = postgres(databaseUrl, {
    ssl: isLocal ? false : 'require',
    prepare: false,
  })

  await sql.unsafe(QUESTION_BANK_SCHEMA)

  const entries = [
    ...loadJson('songs.json').map(entry => ({ type: 'song', entry })),
    ...loadJson('characters.json').map(entry => ({ type: 'character', entry })),
    ...loadJson('quotes.json').map(entry => ({ type: 'quote', entry })),
  ]

  let inserted = 0
  let skipped = 0

  for (const { type, entry } of entries) {
    const { id, ...payload } = entry
    const result = await sql`
      INSERT INTO question_bank (id, type, payload)
      VALUES (${id}, ${type}, ${sql.json(payload)})
      ON CONFLICT (id) DO NOTHING
    `
    if (result.count > 0) {
      inserted++
    }
    else {
      skipped++
    }
  }

  await sql.end()
  console.log(`匯入完成：新增 ${inserted} 題，略過 ${skipped} 題（已存在）`)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
