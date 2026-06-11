import { QUESTION_BANK_SCHEMA } from '../db/schema.mjs'
import { getDb, isDbEnabled } from '../db/client'

export default defineNitroPlugin(async () => {
  if (!isDbEnabled()) {
    return
  }

  const db = getDb()
  if (!db) {
    return
  }

  await db.unsafe(QUESTION_BANK_SCHEMA)
})
