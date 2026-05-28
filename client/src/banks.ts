import { assignPad } from './ui'

function fileNameFromUrl(url: string) {
  return decodeURIComponent(url.split('/').pop() ?? 'Sample')
}

export async function loadBank(bank: number) {
  const res = await fetch(`http://localhost:3001/api/banks/${bank}`)

  if (!res.ok) {
    throw new Error(`Failed to load bank ${bank}`)
  }

  const data = await res.json()
  console.log('Loaded bank data:', data)

  const pads = data.pads

  if (Array.isArray(pads)) {
    for (const item of pads) {
      assignPad(bank, item.pad, item.sampleUrl, item.sampleName)
    }
    return
  }

  for (const [pad, sampleUrl] of Object.entries(data)) {
    if (typeof sampleUrl !== 'string') continue

    assignPad(bank, Number(pad), sampleUrl, fileNameFromUrl(sampleUrl))
  }
}