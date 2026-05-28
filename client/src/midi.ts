import { triggerPad, switchBank } from './ui'

const recentPadHits = new Map<string, number>()

function mirrorPad(rawPad: number) {
  const row = Math.floor((rawPad - 1) / 4)
  const col = (rawPad - 1) % 4

  return row * 4 + (4 - col)
}

function padFromBankNote(note: number) {
  // MIDI Fighter sends:
  // Bank 1: 36-51
  // Bank 2: 52-67
  // Bank 3: 68-83
  // Bank 4: 84-99
  //
  // Convert all banks back to raw pad 1-16.
  const rawPad = ((note - 36) % 16) + 1

  return mirrorPad(rawPad)
}

export async function setupMidi() {
  if (!navigator.requestMIDIAccess) {
    console.warn('Web MIDI not supported')
    return
  }

  const midi = await navigator.requestMIDIAccess()
  console.log('MIDI connected')

  for (const input of midi.inputs.values()) {
    console.log('MIDI input:', input.name)

    input.onmidimessage = (event) => {
      const [status, note, velocity] = event.data

      console.log('MIDI message:', { status, note, velocity })

      // Bank selector buttons: notes 0,1,2,3
      if (status === 147 && velocity > 0 && note >= 0 && note <= 3) {
        const bank = note + 1

        console.log('MIDI bank switch:', bank)
        switchBank(bank)
        return
      }

      // Ignore note-off messages
      if (velocity === 0) return

      // Only handle pad note-on messages
      if (status !== 146) return

      // MIDI Fighter bank pad ranges
      if (note < 36 || note > 99) return

      const pad = padFromBankNote(note)

      // Deduplicate duplicate note-on bursts from the MIDI Fighter
      const key = `${note}:${pad}`
      const now = performance.now()
      const last = recentPadHits.get(key) ?? 0

      if (now - last < 120) {
        console.log('Ignored duplicate MIDI hit:', { note, pad })
        return
      }

      recentPadHits.set(key, now)

      console.log('MIDI pad trigger:', { note, pad })

      // This triggers the pad on the currently selected UI bank
      triggerPad(pad)
    }
  }
}