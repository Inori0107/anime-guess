import type { CreateRoomBody } from '#shared/types/room'
import { createRoom, toPublicRoomState } from '../../utils/roomStore'

export default defineEventHandler(async (event) => {
  const body = await readBody<CreateRoomBody>(event)

  if (!body?.hostType || !body?.nickname) {
    throw createError({ statusCode: 400, message: '缺少必要欄位' })
  }

  if (!body.settings?.types?.length || !body.settings?.count) {
    throw createError({ statusCode: 400, message: '請設定題型與題數' })
  }

  if (body.hostType === 'player' && (!body.manualQuestions || body.manualQuestions.length === 0)) {
    throw createError({ statusCode: 400, message: '玩家主辦需先建立題目' })
  }

  if (body.hostType === 'player' && body.manualQuestions) {
    body.settings.count = body.manualQuestions.length
  }

  const { room, playerId } = createRoom(body)

  return {
    code: room.code,
    playerId,
    room: toPublicRoomState(room),
  }
})
