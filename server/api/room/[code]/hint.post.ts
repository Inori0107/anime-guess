import { useHint } from '../../../utils/roomStore'

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')
  const body = await readBody<{ playerId: string }>(event)

  if (!code || !body?.playerId) {
    throw createError({ statusCode: 400, message: '缺少必要欄位' })
  }

  const result = useHint(code.toUpperCase(), body.playerId)

  if ('error' in result) {
    throw createError({ statusCode: result.status, message: result.error })
  }

  return { hintStage: result.hintStage }
})
