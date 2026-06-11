import postgres from 'postgres'

let sql: ReturnType<typeof postgres> | null = null

const resolveDatabaseUrl = (): string | undefined => {
  try {
    const config = useRuntimeConfig()
    if (config.databaseUrl) {
      return config.databaseUrl
    }
  }
  catch {
    // outside Nitro context (scripts)
  }
  return process.env.DATABASE_URL || undefined
}

export const isDbEnabled = (): boolean => Boolean(resolveDatabaseUrl())

export const getDb = (): ReturnType<typeof postgres> | null => {
  const url = resolveDatabaseUrl()
  if (!url) {
    return null
  }

  if (!sql) {
    const isLocal = url.includes('localhost') || url.includes('127.0.0.1')
    sql = postgres(url, {
      ssl: isLocal ? false : 'require',
      max: 10,
      prepare: false,
    })
  }

  return sql
}
