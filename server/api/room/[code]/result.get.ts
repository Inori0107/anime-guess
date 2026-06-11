import { getResult } from '../../../utils/roomStore'

export default defineEventHandler((event) => {
  const code = getRouterParam(event, 'code')
  if (!code) {
    throw createError({ statusCode: 400, message: '缺少房號' })
  }

  const result = getResult(code.toUpperCase())
  if (!result) {
    throw createError({ statusCode: 404, message: '找不到房間' })
  }

  return result
})
