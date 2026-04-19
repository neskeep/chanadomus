import { addAccessPeer, removeAccessPeer } from '~~/server/utils/ws-access'

export default defineWebSocketHandler({
  open(peer) {
    addAccessPeer(peer)
  },
  close(peer) {
    removeAccessPeer(peer)
  },
  message(peer, message) {
    // Ping/pong keepalive
    if (message.text() === 'ping') {
      peer.send('pong')
    }
  },
})
