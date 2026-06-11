import { getRoom, toPublicRoomState } from '../../../utils/roomStore'

export default defineEventHandler((event) => {
  const code = getRouterParam(event, 'code')
  if (!code) {
    throw createError({ statusCode: 400, message: '缺少房號' })
  }

  const room = getRoom(code)

  if (!room) {
    throw createError({ statusCode: 404, message: '找不到房間' })
  }

  return toPublicRoomState(room)
})
