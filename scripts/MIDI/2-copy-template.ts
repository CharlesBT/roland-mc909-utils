import fs from 'node:fs'
import { join } from 'node:path'
import { useMidifile } from '../../src/useMidiFile.js'

const MIDI_ROOT_DIR = 'H:/_MC909'
const TEMPLATE_FILE = join(MIDI_ROOT_DIR, 'tpl.mid')
const PATTERN_FILE = join(MIDI_ROOT_DIR, 'pat.mid')
const PATTERN_UPDATED_FILE = join(MIDI_ROOT_DIR, 'pat-updated.mid')

const {
  getMidiData,
  writeMidiData,
  getUpdatedMidiTemplateData,
} = useMidifile()

function writeFileSync(data: any, filename = 'output.json') {
  fs.writeFileSync(join(MIDI_ROOT_DIR, filename), JSON.stringify(data, null, 2))
}

const templateData = getMidiData(TEMPLATE_FILE)
// writeFileSync(templateData, 'tpl.json')

const patternData = getMidiData(PATTERN_FILE)
// writeFileSync(patternData, 'pat.json')

const updatedData = getUpdatedMidiTemplateData(templateData, patternData)
writeFileSync(updatedData, 'pat-updated.json')
writeMidiData(PATTERN_UPDATED_FILE, updatedData)
