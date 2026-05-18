import { addPanicPeer, removePanicPeer } from '~~/server/utils/ws-panic'

export default defineWebSocketHandler({
  open(peer) {
    addPanicPeer(peer)
  },
  close(peer) {
    removePanicPeer(peer)
  },
  message(peer, message) {
    // Ping/pong keepalive
    if (message.text() === 'ping') {
      peer.send('pong')
    }
  },
})
