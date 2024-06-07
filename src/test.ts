import fs from 'node:fs'
import path from 'node:path'
import wavefile from 'wavefile'

const { WaveFile } = wavefile // workaround to avoid ts-node issue

const file = path.resolve(path.join(process.cwd(), 'smpl0002.wav'))
const wav = new WaveFile(fs.readFileSync(file))
const smpl = wav.smpl

// const sampleloop = wav.smpl.loops[0]
console.log(wav.container)
console.log(wav.chunkSize)
console.log(wav.fmt)

console.log('wav.smpl:', smpl)
const dataChunk = wav.data

// const y = dataChunk.

const r = {
  LIST: wav.LIST,
  _PMX: wav._PMX,
  bext: wav.bext,
  cue: wav.cue,
  fact: wav.fact,
  container: wav.container,
  chunkSize: wav.chunkSize,
  fmt: wav.fmt,
  smpl: wav.smpl,
  ds64: wav.ds64,
  format: wav.format,
  iXML: wav.iXML,
  junk: wav.junk,
}

fs.writeFileSync('./smpl0002.json', JSON.stringify(dataChunk, null, 2))
