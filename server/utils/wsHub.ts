import type { WsEvent } from '#shared/types/room'

type WsPeer = {
  send: (data: string | object) => void
}

const roomPeers = new Map<string, Set<WsPeer>>()

export const registerPeer = (code: string, peer: WsPeer): void => {
  if (!roomPeers.has(code)) {
    roomPeers.set(code, new Set())
  }
  roomPeers.get(code)!.add(peer)
}

export const unregisterPeer = (code: string, peer: WsPeer): void => {
  const peers = roomPeers.get(code)
  if (!peers) {
    return
  }
  peers.delete(peer)
  if (peers.size === 0) {
    roomPeers.delete(code)
  }
}

export const broadcastToRoom = (code: string, event: WsEvent): void => {
  const peers = roomPeers.get(code)
  if (!peers) {
    return
  }
  const message = JSON.stringify(event)
  for (const peer of peers) {
    try {
      peer.send(message)
    }
    catch {
      // peer disconnected
    }
  }
}
