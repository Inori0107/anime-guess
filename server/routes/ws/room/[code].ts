import { getRoom, setPlayerConnected, toPublicRoomState } from '../../../utils/roomStore'
import { registerPeer, unregisterPeer } from '../../../utils/wsHub'

const peerMeta = new WeakMap<object, { code: string; playerId?: string }>()

const parsePlayerId = (requestUrl?: string): string | undefined => {
  if (!requestUrl) {
    return undefined
  }
  return new URL(requestUrl, 'http://localhost').searchParams.get('playerId') ?? undefined
}

export default defineWebSocketHandler({
  open(peer) {
    const requestUrl = (peer as { request?: { url?: string } }).request?.url ?? ''
    const pathname = new URL(requestUrl || 'http://localhost/ws/room/UNKNOWN', 'http://localhost').pathname
    const code = pathname.split('/').pop()?.toUpperCase() ?? ''
    const playerId = parsePlayerId(requestUrl)

    peerMeta.set(peer, { code, playerId })

    if (!code) {
      peer.close()
      return
    }

    const room = getRoom(code)
    if (!room) {
      peer.close()
      return
    }

    registerPeer(code, peer)

    if (playerId) {
      setPlayerConnected(code, playerId, true)
    }

    peer.send(JSON.stringify({
      type: 'room:state',
      payload: toPublicRoomState(room),
    }))
  },

  close(peer) {
    const meta = peerMeta.get(peer)
    if (!meta?.code) {
      return
    }

    unregisterPeer(meta.code, peer)

    if (meta.playerId) {
      setPlayerConnected(meta.code, meta.playerId, false)
    }
  },

  message(peer, message) {
    const text = message.text?.() ?? message.toString()
    if (text === 'ping') {
      peer.send(JSON.stringify({ type: 'pong' }))
    }
  },
})
