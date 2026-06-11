const buckets = new Map<string, { count: number; resetAt: number }>()

export const checkRateLimit = (
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; retryAfterSec: number } => {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, retryAfterSec: 0 }
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000),
    }
  }

  bucket.count++
  return { allowed: true, retryAfterSec: 0 }
}

export const getClientIp = (event: Parameters<typeof getRequestHeader>[0]): string => {
  const forwarded = getRequestHeader(event, 'x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown'
  }

  return getRequestHeader(event, 'x-real-ip') || 'unknown'
}
