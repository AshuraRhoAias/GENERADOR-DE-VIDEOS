export class AudioAnalyzer {
  private context: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private source: AudioBufferSourceNode | null = null
  private dataArray: Uint8Array<ArrayBuffer> = new Uint8Array(0)
  private startTime = 0
  private pauseOffset = 0
  public audioBuffer: AudioBuffer | null = null

  init() {
    this.context = new AudioContext()
    this.analyser = this.context.createAnalyser()
    this.analyser.fftSize = 2048
    this.analyser.smoothingTimeConstant = 0.8
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>
    this.analyser.connect(this.context.destination)
  }

  async loadFile(file: File): Promise<AudioBuffer> {
    if (!this.context) this.init()
    const arrayBuffer = await file.arrayBuffer()
    const audioBuffer = await this.context!.decodeAudioData(arrayBuffer)
    this.audioBuffer = audioBuffer
    return audioBuffer
  }

  play(offset = 0) {
    if (!this.context || !this.analyser || !this.audioBuffer) return
    this.stop()
    if (this.context.state === 'suspended') this.context.resume()
    this.source = this.context.createBufferSource()
    this.source.buffer = this.audioBuffer
    this.source.connect(this.analyser)
    this.source.start(0, offset)
    this.startTime = this.context.currentTime - offset
    this.pauseOffset = offset
  }

  pause() {
    if (!this.context || !this.source) return
    this.pauseOffset = this.context.currentTime - this.startTime
    this.source.stop()
    this.source = null
  }

  stop() {
    try { this.source?.stop() } catch {}
    this.source = null
    this.pauseOffset = 0
  }

  getCurrentTime() {
    if (!this.context || !this.source) return this.pauseOffset
    return this.context.currentTime - this.startTime
  }

  getFrequencyBands() {
    if (!this.analyser) return { bass: 0, mid: 0, treble: 0, kick: false, beat: false }
    this.analyser.getByteFrequencyData(this.dataArray)

    const bass   = this.avg(0, 10)
    const mid    = this.avg(10, 100)
    const treble = this.avg(100, 512)
    const kick   = bass > 200

    return {
      bass:   bass / 255,
      mid:    mid / 255,
      treble: treble / 255,
      kick,
      beat:   bass > 160,
    }
  }

  getWaveformData(samples = 200): number[] {
    if (!this.analyser) return Array(samples).fill(0)
    const buf = new Uint8Array(this.analyser.fftSize) as unknown as Uint8Array<ArrayBuffer>
    this.analyser.getByteTimeDomainData(buf)
    const step = Math.floor(buf.length / samples)
    return Array.from({ length: samples }, (_, i) => Math.abs(buf[i * step] - 128) / 128)
  }

  private avg(start: number, end: number) {
    let sum = 0
    for (let i = start; i < end && i < this.dataArray.length; i++) sum += this.dataArray[i]
    return sum / (end - start)
  }

  destroy() {
    this.stop()
    this.context?.close()
    this.context = null
  }
}

export const audioAnalyzer = new AudioAnalyzer()
