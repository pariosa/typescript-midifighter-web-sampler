import { playSample } from './audio'
import { loadBank } from './banks'
type Library = Record<string, string[]>

let currentBank = 1
const banks = new Map<number, Map<number, string>>()
const bankNames = new Map<number, Map<number, string>>()

function getBank(bank: number) {
  if (!banks.has(bank)) banks.set(bank, new Map())
  return banks.get(bank)!
}

function getBankNames(bank: number) {
  if (!bankNames.has(bank)) bankNames.set(bank, new Map())
  return bankNames.get(bank)!
}

export async function switchBank(bank: number) {
  currentBank = bank
  console.log('Switched to bank:', bank)

  await loadBank(bank)

  renderPads()
}
export function triggerPad(pad: number) {
  console.log(`Triggered bank ${currentBank}, pad ${pad}`)

  const sampleUrl = getBank(currentBank).get(pad)

  if (!sampleUrl) {
    console.log(`Bank ${currentBank} pad ${pad} is empty`)
    return
  }

  playSample(sampleUrl)
}

export function setupUI() {
  document.body.innerHTML = `
    <div class="app">
      <aside class="browser">
        <h2>Sample Library</h2>
        <div id="library">Loading...</div>
      </aside>

      <main class="sampler">
        <div class="topbar">
          <div>
            <h1>MIDI Fighter Sampler</h1>
            <p>Drag samples onto pads. Click pads or hit MIDI Fighter buttons to play.</p>
          </div>

          <button id="start-button" class="power-button">
            Power On Audio
          </button>
        </div>

            <div class="bank-controls">
            <button data-bank="1">Bank 1</button>
            <button data-bank="2">Bank 2</button>
            <button data-bank="3">Bank 3</button>
            <button data-bank="4">Bank 4</button>
            <button id="fill-random">Fill Banks Randomly</button>
            </div>

        <h2 id="bank-title">Bank 1</h2>
        <div id="pads" class="pads"></div>
      </main>
    </div>
  `

  document.querySelectorAll('[data-bank]').forEach((button) => {
    button.addEventListener('click', () => {
      const bank = Number((button as HTMLElement).dataset.bank)
      switchBank(bank)
    })
  })
  document.getElementById('fill-random')?.addEventListener('click', () => {
          fillBanksRandomly()
        })
  renderPads()
  loadLibrary()
}

function renderPads() {
  const pads = document.getElementById('pads')!
  const title = document.getElementById('bank-title')!

  title.textContent = `Bank ${currentBank}`
  pads.innerHTML = ''

  const activeBank = getBank(currentBank)
  const activeNames = getBankNames(currentBank)

  for (let i = 1; i <= 16; i++) {
    const pad = document.createElement('button')
    pad.className = 'pad'
    pad.dataset.pad = String(i)

    const sampleName = activeNames.get(i) ?? 'Empty'

    pad.innerHTML = `
      <span class="pad-number">${i}</span>
      <span class="pad-name">${sampleName}</span>
      <span class="clear-pad" title="Clear pad">×</span>
    `

    pad.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).classList.contains('clear-pad')) {
        activeBank.delete(i)
        activeNames.delete(i)
        renderPads()
        return
      }

      triggerPad(i)
    })

    pad.addEventListener('dragover', (e) => {
      e.preventDefault()
      pad.classList.add('drag-over')
    })

    pad.addEventListener('dragleave', () => {
      pad.classList.remove('drag-over')
    })

    pad.addEventListener('drop', (e) => {
      e.preventDefault()
      pad.classList.remove('drag-over')

      const sampleUrl = e.dataTransfer?.getData('sample-url')
      const sampleName = e.dataTransfer?.getData('sample-name')

      if (!sampleUrl || !sampleName) return

      activeBank.set(i, sampleUrl)
      activeNames.set(i, sampleName)

      console.log(`Assigned bank ${currentBank}, pad ${i}:`, sampleUrl)

      renderPads()
    })

    pads.appendChild(pad)
  }
}
export function assignPad(bank: number, pad: number, sampleUrl: string, sampleName: string) {
  getBank(bank).set(pad, sampleUrl)
  getBankNames(bank).set(pad, sampleName)

  if (bank === currentBank) {
    renderPads()
  }
}
async function loadLibrary() {
  const libraryEl = document.getElementById('library')!

  const res = await fetch('http://localhost:3001/api/library')
  const library: Library = await res.json()

  libraryEl.innerHTML = ''

  for (const [folder, files] of Object.entries(library)) {
    const group = document.createElement('details')
    group.open = false

    const summary = document.createElement('summary')
    summary.textContent = folder
    group.appendChild(summary)

    for (const file of files) {
      const item = document.createElement('div')
      item.className = 'sample'
      item.textContent = file
      item.draggable = true

      const sampleUrl = `http://localhost:3001/samples/library/${encodeURIComponent(folder)}/${encodeURIComponent(file)}`

      item.addEventListener('dragstart', (e) => {
        e.dataTransfer?.setData('sample-url', sampleUrl)
        e.dataTransfer?.setData('sample-name', file)
      })

      group.appendChild(item)
    }

    libraryEl.appendChild(group)
  }
}
export async function fillBanksRandomly() {
  const res = await fetch('http://localhost:3001/api/library')
  const library: Record<string, string[]> = await res.json()

  const samples = Object.entries(library).flatMap(([folder, files]) =>
    files.map((file) => ({
      name: file,
      url: `http://localhost:3001/samples/library/${encodeURIComponent(folder)}/${encodeURIComponent(file)}`,
    }))
  )

  if (samples.length === 0) {
    console.warn('No samples found')
    return
  }

  for (let bank = 1; bank <= 4; bank++) {
    for (let pad = 1; pad <= 16; pad++) {
      const sample = samples[Math.floor(Math.random() * samples.length)]

      getBank(bank).set(pad, sample.url)
      getBankNames(bank).set(pad, sample.name)
    }
  }

  console.log('Filled all banks randomly')

  renderPads()
}