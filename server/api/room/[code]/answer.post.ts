import { submitAnswer } from '../../../utils/roomStore'

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')
  const body = await readBody<{ playerId: string; choiceId: string; hintStageUsed?: number }>(event)

  if (!code || !body?.playerId || !body?.choiceId) {
    throw createError({ statusCode: 400, message: '缺少必要欄位' })
  }

  const result = submitAnswer(
    code.toUpperCase(),
    body.playerId,
    body.choiceId,
    body.hintStageUsed,
  )

  if ('error' in result) {
    throw createError({ statusCode: result.status, message: result.error })
  }

  return { ok: true }
})
