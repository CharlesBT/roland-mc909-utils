import fs from 'node:fs'
import { parse, join } from 'node:path'
import { useMidifile } from './src/useMidiFile.js'

const { getMidiData, writeMidiData } = useMidifile()

function writeFileSync(data: any, filename = 'output.json') {
  fs.writeFileSync(join(process.cwd(), filename), JSON.stringify(data, null, 2))
}

let midiData = getMidiData(join(process.cwd(), './ref-909.mid'))
writeFileSync(midiData, 'ref-909.json')

midiData = getMidiData(join(process.cwd(), './ref-updated.mid'))
writeFileSync(midiData, 'ref-updated.json')

// writeMidiData(midiData, __dirname + './test2.mid')
