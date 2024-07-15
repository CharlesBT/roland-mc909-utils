import { useACIDSamples } from '../../src/useACIDSamples.js'
import { writeReport } from '../../src/report.js'

const SAMPLE_ROOT_DIR = 'H:/_ACID'
const TARGET_TEMPO_BPM = 170 // tempo in BPM

const acidSamples = useACIDSamples()
/*
  tempo: tempo used for ACID Beatmapped
*/
acidSamples.checkDirLoopTempo(SAMPLE_ROOT_DIR, TARGET_TEMPO_BPM)

writeReport()
