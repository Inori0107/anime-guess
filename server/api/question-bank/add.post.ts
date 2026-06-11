import type { ManualQuestionInput } from '#shared/types/game'
import { addManualQuestionsToBank } from '../../services/questionBank'
import { checkRateLimit, getClientIp } from '../../utils/rateLimit'
import { validateManualQuestions } from '../../utils/questionInputValidation'

const RATE_LIMIT = {
  maxRequests: 10,
  windowMs: 60_000,
}

export default defineEventHandler(async (event) => {
  const ip = getClientIp(event)
  const rate = checkRateLimit(`question-bank:add:${ip}`, RATE_LIMIT.maxRequests, RATE_LIMIT.windowMs)

  if (!rate.allowed) {
    throw createError({
      statusCode: 429,
      message: `請求過於頻繁，請 ${rate.retryAfterSec} 秒後再試`,
    })
  }

  const body = await readBody<{ questions: ManualQuestionInput[] }>(event)

  let questions: ManualQuestionInput[]
  try {
    questions = validateManualQuestions(body?.questions ?? [])
  }
  catch (error) {
    throw createError({
      statusCode: 400,
      message: error instanceof Error ? error.message : '題目格式不正確',
    })
  }

  const result = await addManualQuestionsToBank(questions)

  return {
    added: result.added,
    skipped: result.skipped,
    stats: result.stats,
    message: result.added > 0
      ? `已加入題庫 ${result.added} 題`
      : '題目已存在於題庫，未重複加入',
  }
})
