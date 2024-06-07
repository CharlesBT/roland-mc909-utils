import fs from 'node:fs'
import AudioWAV from '@uttori/audio-wave'

// Read in a WAV file with AudioWAV
const data = fs.readFileSync('./test/assets/input.wav')
const { chunks } = AudioWAV.fromFile(data)

// Remove the header, we will make a new one with our new size.
chunks.splice(0, 1)

// Remove any existing RLND chunks, should be after `fmt `
const roland_index = chunks.findIndex((chunk) => chunk.type === 'roland')
if (roland_index > 0) {
  chunks.splice(roland_index, 1)
}

// Create a RLND chunk and set the pad to J12
const rlnd = AudioWAV.encodeRLND({ device: 'roifspsx', sampleIndex: 'J12' })

// Add the new RLND after the format chunk
const index = chunks.findIndex((chunk) => chunk.type === 'format')
chunks.splice(index + 1, 0, { type: 'roland', chunk: rlnd })

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
fs.writeFileSync('./test/assets/output.WAV', output)
