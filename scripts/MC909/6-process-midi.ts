import fs from 'node:fs'
import { join } from 'node:path'
import { useMidifile } from '../../src/useMidiFile.js'

const MIDI_ROOT_DIR = 'H:/_MC909'
const REF_FILE = join(MIDI_ROOT_DIR, 'ref.mid')
const REF_UPDATED_FILE = join(MIDI_ROOT_DIR, 'ref-updated.mid')
const NEW_FILE = join(MIDI_ROOT_DIR, 'new.mid')

const {
  getMidiData,
  writeMidiData,
  getRefPatternInfo,
  getNewPatternInfo,
  getUpdatedMidiRefData,
  displayTrackInfo,
} = useMidifile()

function writeFileSync(data: any, filename = 'output.json') {
  fs.writeFileSync(join(MIDI_ROOT_DIR, filename), JSON.stringify(data, null, 2))
}

const refData = getMidiData(REF_FILE)
// writeFileSync(refData, 'ref.json')
const refFilteredData = getMidiData(REF_FILE)
// writeFileSync(refFilteredData, 'ref-filtered.json')

const refInfo = getRefPatternInfo(refData)
console.info(`Ref Pattern: measure(s)=${refInfo.measures}, beat(s)=${refInfo.beats}`)

const newData = getMidiData(NEW_FILE)
// writeFileSync(newData, 'new.json')
const newInfo = getNewPatternInfo(newData)
console.info(`New Pattern: measure(s)=${newInfo.measures}, beat(s)=${newInfo.beats}`)
const refUpdatedData = getUpdatedMidiRefData(refFilteredData, newData)
writeFileSync(refUpdatedData, 'new-updated.json')
// displayTrackInfo(refUpdatedData)
writeMidiData(REF_UPDATED_FILE, refUpdatedData)
