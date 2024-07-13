import { useMC909Samples } from '../../src/useMC909Samples.js'
import { writeReport } from '../../src/report.js'

const SAMPLE_ROOT_DIR = 'H:/_MC909'

const MC909Samples = useMC909Samples()
MC909Samples.updateDirWithRolandChunk(SAMPLE_ROOT_DIR)

/*
WARNING if there are empty slot between samples, the loading is longer
TONE_PATCHES slots : 3-2000, slot starting to 3 to keep an empty slot for stereo sampling
RHYTHM_PATCHES slots : 2000-7000 for loops, drums, hits, vocals, fx ...
*/

MC909Samples.renameFiles(SAMPLE_ROOT_DIR, 3)

writeReport()
