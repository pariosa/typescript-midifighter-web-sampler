let audioContext: AudioContext | null = null

const bufferCache = new Map<string, AudioBuffer>()
const activeSources = new Map<string, AudioBufferSourceNode>()

export async function initAudio() {
  audioContext = new AudioContext()

  if (audioContext.state === 'suspended') {
    await audioContext.resume()
  }
}

export async function playSample(url: string) {
  if (!audioContext) {
    console.warn('Audio not initialized')
    return
  }

  // Always cut off the previous instance of this exact sample first
  const previousSource = activeSources.get(url)

  if (previousSource) {
    console.log('Cutting off previous sample:', url)

    previousSource.onended = null

    try {
      previousSource.stop()
    } catch {
      // source may have already ended
    }

    activeSources.delete(url)
  }

  let audioBuffer = bufferCache.get(url)

  if (!audioBuffer) {
    console.log('Loading sample:', url)

    const res = await fetch(url)

    if (!res.ok) {
      throw new Error(`Sample failed to load: ${res.status} ${url}`)
    }

    const arrayBuffer = await res.arrayBuffer()
    audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

    bufferCache.set(url, audioBuffer)
  }

  console.log('Playing sample from beginning:', url)

  const source = audioContext.createBufferSource()
  source.buffer = audioBuffer
  source.connect(audioContext.destination)

  activeSources.set(url, source)

  source.onended = () => {
    if (activeSources.get(url) === source) {
      activeSources.delete(url)
    }
  }

  source.start(0)
}