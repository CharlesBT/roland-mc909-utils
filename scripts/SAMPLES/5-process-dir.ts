import { useMC909Samples } from '../../src/useMC909Samples.js'
import { writeReport } from '../../src/report.js'

const SAMPLE_ROOT_DIR = 'H:/_MC909'
const SAMPLE_START_INDEX = 3 // start index for the first sample e.g. 3 = smpl0003.wav
const REMOVE_Z_EMPTY_SLOTS = true

const MC909Samples = useMC909Samples()
MC909Samples.updateDirWithRolandChunk(SAMPLE_ROOT_DIR)

/*
WARNING if there are empty slot between samples, the sample loading get longer on the MC909
*/

MC909Samples.renameFiles(SAMPLE_ROOT_DIR, SAMPLE_START_INDEX, REMOVE_Z_EMPTY_SLOTS)

writeReport()
