import fs from 'node:fs'
import path from 'node:path'
import wavefile from 'wavefile'
import { AudioWAV } from './audio-wav.js'
import { log } from './report.js'
import { checkFilesExtension, listFilesRecursiveSync } from './utils.js'
import type { FMT, ACID } from './types.js'

export function useACIDSamples() {
  function encodeACID(data: { type: 0 | 1 | 28; beats?: number; tempo?: number }) {
    const type = data.type
    const rootNote = 60
    const unknown1 = 32768
    const unknown2 = 0
    const beats = data.beats || 999977
    const meterDenominator = 4
    const meterNumerator = 4
    const tempo = data.tempo || 120

    // Padding
    const buffer = Buffer.alloc(32, 0)

    // ChunkID
    buffer.write('acid', 0)

    // Chunk Size
    buffer.writeUInt32LE(24, 4)

    // type
    buffer.writeUInt32LE(type, 8)

    // rootNote
    buffer.writeUInt16LE(rootNote, 12)

    // Unknown
    buffer.writeUInt16LE(unknown1, 14)
    buffer.writeUInt32LE(unknown2, 16)

    // Number of beats
    buffer.writeUInt32LE(beats, 20)

    // Meter Denominator, like the 4 in 5/4
    buffer.writeUInt16LE(meterDenominator, 24)

    // Meter Numerator, like the 3 in 3/4
    buffer.writeUInt16LE(meterNumerator, 26)

    // Tempo
    buffer.writeFloatLE(tempo, 28)

    return buffer
  }

  /*
  type: 0 = ACIDized loops, 1 = One-Shot, 28 = ACID Beatmapped
  beats: number of beats used fot ACIDized loops
  tempo: tempo used for ACID Beatmapped
  */
  function updateAcidChunk(file: string, type: 0 | 1 | 28, beats?: number, tempo?: number) {
    const { chunks } = AudioWAV.fromFile(fs.readFileSync(file), {})

    const fmt: FMT = chunks.find((chunk) => chunk.type === 'format').value
    if (fmt.sampleRate !== 44100) throw new Error(`SampleRate must be 44100, ${file}`)

    const { WaveFile } = wavefile // workaround to avoid ts-node issue
    const wav = new WaveFile(fs.readFileSync(file))

    // sample size
    const samples = wav.getSamples()
    let sampleSize = 0
    if (fmt.channels === 1) sampleSize = samples.length
    if (fmt.channels === 2) sampleSize = (samples[0] as unknown as Float64Array).length
    // console.log('sampleSize: ' + sampleSize)

    // Remove the header, we will make a new one with our new size.
    chunks.splice(0, 1)

    // ACID chunk
    const acid_index = chunks.findIndex((chunk) => chunk.type === 'acid')
    // Remove any existing acid chunks, should be after `fmt `
    if (acid_index > 0) {
      chunks.splice(acid_index, 1)
    }

    const acid = encodeACID({ type, beats, tempo })

    // Add the new Acid chunk after the format chunk
    const index = chunks.findIndex((chunk) => chunk.type === 'format')
    chunks.splice(index + 1, 0, { type: 'acid', chunk: acid })

    // Calculate the total size, include `WAVE` text (4 bytes)
    const size = chunks.reduce((total, chunk) => {
      total += chunk.chunk.length
      return total
    }, 4)

    // Build the binary data
    const header = AudioWAV.encodeHeader({ size })
    const parts = chunks.reduce(
      (arr, chunk) => {
        arr.push(Buffer.from(chunk.chunk))
        return arr
      },
      [header],
    )
    const output = Buffer.concat(parts)

    // Write file, *.WAV as that is what the offical software uses.
    fs.writeFileSync(file, output)
  }

  function updateDirWithAcidChunk(dir: string, type: 0 | 1 | 28, beats?: number, tempo?: number) {
    checkFilesExtension(dir)
    log(`Processing ${dir} ...`)
    log('Updating files with Acid chunk ...')
    const files = listFilesRecursiveSync(dir)
    for (const file of files) {
      try {
        updateAcidChunk(file, type, beats, tempo)
      } catch (e) {
        log(`ERROR with ${file}\r\n${(e as Error).message}`)
      }
    }
  }

  function checkDirLoopTempo(dir: string, tempo: number) {
    checkFilesExtension(dir)
    log(`Processing ${dir} ...`)
    log(`Checking files tempo: ${tempo} ...`)
    const files = listFilesRecursiveSync(dir)
    const { WaveFile } = wavefile // workaround to avoid ts-node issue
    for (const file of files) {
      const { chunks } = AudioWAV.fromFile(fs.readFileSync(file), {})
      const wav = new WaveFile(fs.readFileSync(file))
      const fmt: FMT = chunks.find((chunk) => chunk.type === 'format').value
      if (!fmt.channels) throw new Error(`channels is missing, ${file}`)
      if (!fmt.blockAlign) throw new Error(`blockAlign is missing, ${file}`)

      // sample size
      const samples = wav.getSamples()
      let sampleSize = 0
      if (fmt.channels === 1) sampleSize = samples.length
      if (fmt.channels === 2) sampleSize = (samples[0] as unknown as Float64Array).length
      if (!fmt.sampleRate) throw new Error(`sampleRate is missing, ${file}`)
      // console.log('sampleSize: ' + sampleSize)

      // tempo from ACIDized WAV
      let bpm = 0
      const acid = chunks.find((chunk) => chunk.type === 'acid')
      if (acid) {
        const duration = sampleSize / fmt.sampleRate
        const acidProps = acid.value as ACID
        switch (acidProps.type) {
          case 0: // ACIDized loops
            if (acidProps.meterDenominator === 4 && acidProps.meterNumerator === 4) {
              bpm = Math.round((acidProps.beats / duration) * 60)
              if (bpm !== tempo) {
                log(`ERROR with ${file}\r\nTempo is ${bpm} must be ${tempo}`)
              }
            }
            break
          default:
            log(`ERROR with ${file}\r\nNot an ACIDized loop`)
            break
        }
      } else {
        log(`ERROR with ${file}\r\nACID chunk not found`)
      }
    }
  }

  return {
    updateAcidChunk,
    updateDirWithAcidChunk,
    checkDirLoopTempo,
  }
}
