import { getQuestionBankStats } from '../../services/questionBank'
import { listQuestions } from '../../utils/questionBankDb'

export default defineEventHandler(async () => {
  const [stats, items] = await Promise.all([
    getQuestionBankStats(),
    listQuestions(),
  ])

  return { stats, items }
})
