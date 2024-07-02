import fs from 'node:fs'
import path from 'node:path'
import { AudioWAV } from '../../src/audio-wav.js'

function writeFileSync(data: any, filename = 'output.json') {
  fs.writeFileSync(path.join(process.cwd(), filename), JSON.stringify(data, null, 2))
}

// Read in a WAV file with AudioWAV
const data = fs.readFileSync('./test.wav')
const { chunks } = AudioWAV.fromFile(data, {})

writeFileSync(chunks, 'chunks.json')
