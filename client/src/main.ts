import { fillBanksRandomly, setupUI } from './ui'
import { setupMidi } from './midi'
import { initAudio } from './audio'
import { loadBank } from './banks'
import './styles.css'

async function init() {
  console.log('waiting for user gesture')

  // render app UI first
  setupUI()

  // find the built-in power button from ui.ts
  const startButton = document.getElementById(
    'start-button'
  ) as HTMLButtonElement | null

  if (!startButton) {
    console.error('Start button not found')
    return
  }

  startButton.addEventListener('click', async () => {
    try {
      console.log('starting init')

      startButton.disabled = true
      startButton.textContent = 'Starting...'

      // init web audio
      await initAudio()
      console.log('audio ready')

      // load first bank
      await loadBank(1)
      console.log('bank loaded')

      // init midi
      await setupMidi()
      console.log('midi setup')

      // update UI state
      startButton.textContent = 'Audio Active'
      startButton.classList.add('active')
    
    } catch (err) {
      console.error('Init failed:', err)

      startButton.disabled = false
      startButton.textContent = 'Power On Audio'
    }
  })
}

init()