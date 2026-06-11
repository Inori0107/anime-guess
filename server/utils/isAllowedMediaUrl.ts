const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '[::1]',
])

const isPrivateIpv4 = (hostname: string): boolean => {
  const match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (!match) {
    return false
  }

  const octets = match.slice(1).map(Number)
  if (octets.some(o => o > 255)) {
    return false
  }

  const a = octets[0]!
  const b = octets[1]!
  if (a === 10 || a === 127 || a === 0) {
    return true
  }
  if (a === 169 && b === 254) {
    return true
  }
  if (a === 192 && b === 168) {
    return true
  }
  if (a === 172 && b >= 16 && b <= 31) {
    return true
  }

  return false
}

export const parseAllowedMediaUrl = (rawUrl: string): URL => {
  let parsed: URL
  try {
    parsed = new URL(rawUrl.trim())
  }
  catch {
    throw createError({ statusCode: 400, message: '無效的 URL' })
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw createError({ statusCode: 400, message: '僅支援 http 或 https 連結' })
  }

  const hostname = parsed.hostname.toLowerCase()
  if (
    BLOCKED_HOSTNAMES.has(hostname)
    || hostname.endsWith('.localhost')
    || hostname.endsWith('.local')
    || isPrivateIpv4(hostname)
  ) {
    throw createError({ statusCode: 400, message: '不允許的媒體來源' })
  }

  return parsed
}
