import type { JoinRoomBody } from '#shared/types/room'
import { joinRoom, toPublicRoomState } from '../../utils/roomStore'

export default defineEventHandler(async (event) => {
  const body = await readBody<JoinRoomBody>(event)

  if (!body?.code || !body?.nickname) {
    throw createError({ statusCode: 400, message: '請輸入房號與暱稱' })
  }

  const result = joinRoom(body)

  if ('error' in result) {
    throw createError({ statusCode: result.status, message: result.error })
  }

  return {
    code: result.room.code,
    playerId: result.playerId,
    room: toPublicRoomState(result.room),
  }
})
