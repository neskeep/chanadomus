// Chime suave de una sola vez para avisos no urgentes (eventos).
// Semanticamente distinto de la alarma persistente de panico (usePanicStream):
// dos notas ascendentes cortas, volumen bajo, sin repeticion.
let chimeCtx: AudioContext | null = null

export function useAlertSound() {
  function playChime() {
    if (typeof window === 'undefined') return
    try {
      if (!chimeCtx || chimeCtx.state === 'closed') {
        chimeCtx = new AudioContext()
      }
      const ctx = chimeCtx
      // Algunos navegadores inician el contexto suspendido hasta un gesto del usuario
      if (ctx.state === 'suspended') void ctx.resume().catch(() => {})

      const notes = [{ freq: 660, start: 0 }, { freq: 880, start: 0.12 }]
      const noteDuration = 0.18

      for (const note of notes) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = 'sine'
        osc.frequency.value = note.freq
        const t = ctx.currentTime + note.start
        gain.gain.setValueAtTime(0.0001, t)
        gain.gain.exponentialRampToValueAtTime(0.15, t + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.0001, t + noteDuration)
        osc.start(t)
        osc.stop(t + noteDuration)
      }
    }
    catch {
      // Audio no disponible (autoplay bloqueado o sin soporte). Silencioso a proposito:
      // el aviso visual (badge/toast/banner) cubre la notificacion.
    }
  }

  return { playChime }
}
