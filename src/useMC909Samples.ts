import fs from 'node:fs'
import path from 'node:path'
import wavefile from 'wavefile'
import { AudioWAV } from './audio-wav.js'
import { log } from './report.js'
import { checkFilesExtension, listFilesRecursiveSync, listWavFilesRecursiveSync } from './utils.js'
import { defaultMidiKeyMap, allowedKeys } from './midiKeymap.js'
import type { smpl, FMT, ACID } from './types'

const { WaveFile } = wavefile // workaround to avoid ts-node issue

/*
  name: chunk 20
  Start Point: chunk 36-39
  Loop Start: chunk 40-43
  End Point: chunk 44-47
  Samples: chunk 48-51

  Start Fine: chunk 192
  Loop Start Fine: chunk 193
  Loop End Fine: chunk 194
  Loop Mode 0-4: chunk 195
  Loop Tune: chunk 196
  Original Key: chunk 197
  Time Stretch Type (0-9): chunk 198
  BPM: chunk 202-203
  */

export function useMC909Samples() {
  function checkFilenames(dir: string) {
    log(`Processing ${dir} ...`)
    log('Checking filenames ...')
    const files = listFilesRecursiveSync(dir)
    // check filename length > 16
    for (const file of files) {
      const name = path.parse(file).name
      if (name.length > 16) {
        log(`wrong filename: ${file}`)
      }
    }
  }

  function checkSampleRateAndBitDepth(dir: string) {
    log(`Processing ${dir} ...`)
    log('Checking samplerate and bitdepth ...')
    const files = listFilesRecursiveSync(dir)

    // check sample rate and bitdepth
    for (const file of files) {
      try {
        const wav = new WaveFile(fs.readFileSync(file))
        const fmt = wav.fmt as any
        if (!fmt.numChannels) log(`numChannels is missing: ${file}`)
        if (!fmt.blockAlign) log(`blockAlign is missing: ${file}`)
        if (fmt.sampleRate !== 44100) log(`SampleRate must be 44100: ${file}`)
        if (fmt.bitsPerSample !== 16) log(`bitsPerSample must be 16: ${file}`)
      } catch (e) {
        log(`ERROR with : ${file}`)
        // console.error(`ERROR with ${file}\r\n${(e as Error).message}`)
      }
    }
  }

  function checkFiles(dir: string) {
    checkFilesExtension(dir)
    checkFilenames(dir)
    checkSampleRateAndBitDepth(dir)
  }

  function extractMidiKeyFromFilename(file: string) {
    const filenameWithoutExtension = path.basename(file, path.extname(file))
    const lastSpace = filenameWithoutExtension.lastIndexOf(' ')
    const scale = filenameWithoutExtension.substring(lastSpace).trim()
    const key = scale.replace('m', '')
    if (key.length) {
      if (allowedKeys.includes(key)) {
        // log(`${file} detected key : ${key}`)
        const midiKey = defaultMidiKeyMap.get(key + '3')
        return midiKey
      }
    }
    return undefined
  }

  function getRolandName(file: string): string {
    let name = path.parse(file).name
    if (name.length > 16) name = name.slice(0, 16)
    return name.padEnd(16, ' ')
  }

  function createRolandChunk(opts: {
    file: string
    wav: wavefile.WaveFile
    sampleSize: number
    bpm?: number
    key?: number
  }) {
    // get sample loop
    let loopStart = 0
    let loopEnd = 0
    let loopMode = 1 // ONE-SHOT
    const sampleloop = (<smpl>opts.wav.smpl).loops[0]
    if (sampleloop) {
      loopMode = 0 // FWD
      loopStart = sampleloop.dwStart
      loopEnd = sampleloop.dwEnd + 1
      // loopEnd = sampleloop.dwEnd
    }

    // Create a ROLAND MC-909 chunk
    const roland = AudioWAV.encodeRLND({
      name: getRolandName(opts.file),
      startPoint: 0,
      loopStart,
      loopEnd,
      samples: opts.sampleSize,
      startFine: 0,
      loopStartFine: 0,
      loopEndFine: 0,
      loopMode,
      loopTune: 0,
      key: typeof opts.key === 'number' ? opts.key : 60,
      timestretchType: 9, // Auto sync method, Decreasing this value will optimize the sound for more rapid phrases, and increasing this value will optimize the sound for slower phrases.
      bpm: typeof opts.bpm === 'number' ? opts.bpm : 0,
    })

    return roland
  }

  function updateRolandChunk(file: string) {
    // log(`Processing ${file} ...`)

    try {
      const { chunks } = AudioWAV.fromFile(fs.readFileSync(file), {})

      const fmt: FMT = chunks.find((chunk) => chunk.type === 'format').value
      if (!fmt.channels) throw new Error(`channels is missing, ${file}`)
      if (!fmt.blockAlign) throw new Error(`blockAlign is missing, ${file}`)
      if (!fmt.sampleRate) throw new Error(`sampleRate is missing, ${file}`)
      // if (fmt.sampleRate !== 44100) throw new Error(`SampleRate must be 44100, ${file}`)
      // if (fmt.bitsPerSample !== 16) throw new Error(`bitsPerSample must be 16, ${file}`)

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

      // ROLAND chunk
      const roland_index = chunks.findIndex((chunk) => chunk.type === 'roland')
      // Remove any existing RLND chunks, should be after `fmt `
      if (roland_index > 0) {
        chunks.splice(roland_index, 1)
      }

      // tempo from ACIDized WAV
      let bpm = 0
      const acid = chunks.find((chunk) => chunk.type === 'acid')
      if (acid) {
        const duration = sampleSize / fmt.sampleRate
        const acidProps = acid.value as ACID
        switch (acidProps.type) {
          case 0: // ACIDized loops
            if (acidProps.meterDenominator === 4 && acidProps.meterNumerator === 4) {
              bpm = Math.round((acidProps.beats / duration) * 60 * 100)
            }
            break
          case 28: // ACID Beatmapped
            bpm = Math.round(acid.value.tempo * 100)
            break
        }
      }

      // extract key form filename
      const key = extractMidiKeyFromFilename(file)
      // console.log('key: ' + key)

      const roland = createRolandChunk({ file, wav, sampleSize, bpm, key })

      // Add the new ROLAND chunk after the format chunk
      const index = chunks.findIndex((chunk) => chunk.type === 'format')
      chunks.splice(index + 1, 0, { type: 'roland', chunk: roland })

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
    } catch (e) {
      log(`ERROR with ${file}\r\n${(e as Error).message}`)
    }
  }

  function updateDirWithRolandChunk(dir: string) {
    checkFilesExtension(dir)
    log(`Processing ${dir} ...`)
    log('Updating files with Roland chunk ...')
    const files = listFilesRecursiveSync(dir)
    for (const file of files) {
      try {
        updateRolandChunk(file)
      } catch (e) {
        log(`ERROR with ${file}\r\n${(e as Error).message}`)
      }
    }
  }

  function renameFiles(dir: string, index: number = 1) {
    checkFilesExtension(dir)
    log(`Processing ${dir} ...`)
    log('Renaming files ...')
    const files = listFilesRecursiveSync(dir)
    for (const file of files) {
      // const name = path.parse(file).name
      const ext = path.extname(file)
      const newName = `smpl${index.toString().padStart(4, '0')}${ext}`
      const newFilename = path.join(path.dirname(file), newName)
      fs.renameSync(file, newFilename)
      log(newName)
      const { WaveFile } = wavefile // workaround to avoid ts-node issue
      const wav = new WaveFile(fs.readFileSync(newFilename))
      const fmt = wav.fmt as any
      if (fmt.numChannels === 2) index = index + 2
      else index++
    }
  }

  function getChannels(file: string) {
    try {
      // log(`Processing ${file} ...`)
      const r = true
      const { WaveFile } = wavefile // workaround to avoid ts-node issue
      const wav = new WaveFile(fs.readFileSync(file))
      const fmt = wav.fmt as any
      return fmt.numChannels
    } catch (e) {
      log(`ERROR with ${file}\r\n${(e as Error).message}`)
    }
  }

  function countSampleSlots(dir: string) {
    log(`Processing ${dir} ...`)
    log('Counting sample slots ...')
    const files = listWavFilesRecursiveSync(dir)
    let i = 0
    for (const file of files) {
      const channels = getChannels(file)
      if (channels === 1) i++
      else if (channels === 2) i += 2
      else console.error(`ERROR: ${file} has ${channels} channels`)
    }
    log(`Total sample slots required: ${i}`)
  }

  function isMonoWith2Channels(file: string) {
    try {
      // log(`Processing ${file} ...`)
      const r = true
      const { WaveFile } = wavefile // workaround to avoid ts-node issue
      const wav = new WaveFile(fs.readFileSync(file))
      const fmt = wav.fmt as any
      if (fmt.numChannels < 2) return false
      if (fmt.numChannels === 2) {
        const rightSamples = wav.getSamples()[1] as unknown as Float64Array
        const leftSamples = wav.getSamples()[0] as unknown as Float64Array
        for (let i = 0; i < rightSamples.length; i++) {
          if (rightSamples[i] !== leftSamples[i]) return false
        }
      }
      return r
    } catch (e) {
      log(`ERROR with ${file}\r\n${(e as Error).message}`)
    }
  }

  function getListOfMonoWith2Channels(dir: string) {
    log(`Scanning ${dir} ...`)
    log('Searching for mono files with 2 channels ...')
    const directoryFiles = listFilesRecursiveSync(dir)
    const files = directoryFiles.filter((file) => path.extname(file).toLowerCase() === '.wav')
    const r: string[] = []
    for (const file of files) {
      if (isMonoWith2Channels(file)) r.push(file)
    }
    return r
  }

  return {
    checkFilesExtension,
    checkFilenames,
    checkSampleRateAndBitDepth,
    checkFiles,
    countSampleSlots,
    updateRolandChunk,
    updateDirWithRolandChunk,
    renameFiles,
    getListOfMonoWith2Channels,
  }
}
