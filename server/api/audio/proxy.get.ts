import { parseAllowedMediaUrl } from '../../utils/isAllowedMediaUrl'

export default defineEventHandler(async (event) => {
  const rawUrl = getQuery(event).url as string

  if (!rawUrl) {
    throw createError({ statusCode: 400, message: '缺少音訊 URL' })
  }

  const parsed = parseAllowedMediaUrl(rawUrl)
  const range = getRequestHeader(event, 'range')

  try {
    const response = await fetch(parsed.toString(), {
      headers: {
        Accept: 'audio/*,video/*,*/*',
        'User-Agent': 'Mozilla/5.0 (compatible; AnimeGuess/1.0)',
        ...(range ? { Range: range } : {}),
      },
    })

    if (!response.ok && response.status !== 206) {
      throw createError({ statusCode: response.status, message: '無法載入音訊' })
    }

    const contentType = response.headers.get('content-type') ?? 'application/octet-stream'
    const contentRange = response.headers.get('content-range')
    const acceptRanges = response.headers.get('accept-ranges')
    const contentLength = response.headers.get('content-length')

    setResponseHeaders(event, {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400',
      ...(acceptRanges ? { 'Accept-Ranges': acceptRanges } : { 'Accept-Ranges': 'bytes' }),
      ...(contentRange ? { 'Content-Range': contentRange } : {}),
      ...(contentLength ? { 'Content-Length': contentLength } : {}),
    })

    setResponseStatus(event, response.status)
    return response.body
  }
  catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    throw createError({ statusCode: 502, message: '音訊代理失敗' })
  }
})
