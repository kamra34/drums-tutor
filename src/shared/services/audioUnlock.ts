/**
 * Mobile AudioContext unlock utility.
 *
 * iOS WebKit (used by ALL iOS browsers including Chrome) requires:
 * 1. AudioContext.resume() called during a user gesture
 * 2. A buffer source .start() called during a user gesture
 *
 * Additionally, iOS respects the hardware mute (ringer) switch for Web Audio.
 * Playing an HTML <audio> element first forces iOS into "playback mode",
 * which allows Web Audio to produce sound even when the switch is on silent.
 */

// Tiny silent MP3 (1 frame, ~120 bytes) encoded as base64 data URI.
// Playing this via <audio> forces iOS into media playback mode.
const SILENT_MP3 = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAABhgBKIJoAAAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAABhgBKIJoAAAAAAAAAAAAAAAAA'

let _iosUnlocked = false

/**
 * Register and immediately unlock an AudioContext.
 * Designed to be called from ctx() factory functions during user gestures.
 */
export function registerAudioContext(ctx: AudioContext): void {
  // Resume the context
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})

  // Play a silent buffer via Web Audio API to unlock it
  try {
    const buf = ctx.createBuffer(1, 1, 22050)
    const src = ctx.createBufferSource()
    src.buffer = buf
    src.connect(ctx.destination)
    src.start(0)
  } catch {}

  // On iOS, also play a silent MP3 via <audio> to enter "playback mode".
  // This overrides the hardware mute switch so Web Audio can be heard.
  if (!_iosUnlocked) {
    _iosUnlocked = true
    try {
      const audio = new Audio(SILENT_MP3)
      audio.setAttribute('playsinline', '')
      audio.volume = 0.01
      const p = audio.play()
      if (p) p.catch(() => {})
    } catch {}
  }
}
