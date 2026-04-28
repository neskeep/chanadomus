import type { Peer } from 'crossws'
import type { AccessEvent } from '~~/shared/types/access'

const peers = new Set<Peer>()

export function addAccessPeer(peer: Peer) {
  peers.add(peer)
}

export function removeAccessPeer(peer: Peer) {
  peers.delete(peer)
}

export function broadcastAccessEvent(event: AccessEvent) {
  const message = JSON.stringify({ type: 'access-event', data: event })
  for (const peer of peers) {
    peer.send(message)
  }
}

export function broadcastAccessMessage(type: string, data: unknown) {
  const message = JSON.stringify({ type, data })
  for (const peer of peers) {
    peer.send(message)
  }
}
