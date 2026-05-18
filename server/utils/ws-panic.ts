import type { Peer } from 'crossws'

export interface PanicAlert {
  id: string
  createdAt: string
  userName: string
  userEmail: string
  userPhone: string | null
  userImage: string | null
  unitNumber: string | null
  unitLabel: string | null
  chatRoomId: string | null
}

const peers = new Set<Peer>()

export function addPanicPeer(peer: Peer) {
  peers.add(peer)
}

export function removePanicPeer(peer: Peer) {
  peers.delete(peer)
}

export function broadcastPanicAlert(alert: PanicAlert) {
  const message = JSON.stringify({ type: 'panic-alert', data: alert })
  for (const peer of peers) {
    peer.send(message)
  }
}
